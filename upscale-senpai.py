"""
upscale-senpai.py
-----------------
1. Lit toutes les images Senpai depuis le dossier local data/senpai-goddess-haven/
2. Trim automatique des bords blancs (Pillow)
3. Upscale x2 via Real-ESRGAN
4. Export en PNG
5. Re-upload sur Cloudflare R2 (écrase les .webp)
6. Met à jour data/senpai-goddess-haven/cards.json avec les nouvelles URLs .png

PREREQUIS :
  pip install realesrgan basicsr boto3 pillow torch torchvision
  Télécharger le modèle : https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth
  Le placer dans : weights/RealESRGAN_x2plus.pth

USAGE :
  python upscale-senpai.py
"""

import os
import json
import io
import numpy as np
import boto3
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

# =====================
# CONFIG R2
# =====================
BUCKET_NAME      = "senpaigodesshaven"
R2_ENDPOINT      = "https://16f7b055e3110c17f066c07bcb085fb6.r2.cloudflarestorage.com"
ACCESS_KEY_ID    = "948c10adeb1623abb6f41356e5d7e93c"
SECRET_ACCESS_KEY= "39e279b7ef03d65716eae0888b790628d29c6a06a85f6832ce893a5bad02001b"
PUBLIC_BASE_URL  = "https://pub-e8c5071de0564bea983e932d113a1c89.r2.dev"

# =====================
# CONFIG CHEMINS
# =====================
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR     = os.path.join(SCRIPT_DIR, "data", "senpai-goddess-haven")
CARDS_JSON   = os.path.join(DATA_DIR, "cards.json")
MODEL_PATH   = os.path.join(SCRIPT_DIR, "weights", "RealESRGAN_x2plus.pth")
SETS         = ["set1", "set2", "set3"]  # Ajouter set4, set5, set6 quand disponibles

# =====================
# INIT S3 CLIENT
# =====================
s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=ACCESS_KEY_ID,
    aws_secret_access_key=SECRET_ACCESS_KEY,
    region_name="auto",
)

# =====================
# INIT REAL-ESRGAN
# =====================
def init_upscaler():
    print("🔧 Chargement du modèle Real-ESRGAN x2...")
    model = RRDBNet(
        num_in_ch=3, num_out_ch=3,
        num_feat=64, num_block=23, num_grow_ch=32,
        scale=2
    )
    upscaler = RealESRGANer(
        scale=2,
        model_path=MODEL_PATH,
        model=model,
        tile=512,        # traitement par tuiles pour économiser la RAM/VRAM
        tile_pad=10,
        pre_pad=0,
        half=False,      # passer à True si tu as un GPU avec FP16
    )
    print("✅ Modèle chargé")
    return upscaler

# =====================
# TRIM BORDS BLANCS
# =====================
def trim_white_borders(img: Image.Image, threshold=240) -> Image.Image:
    """Supprime les bords blancs/presque blancs autour de l'image."""
    img_array = np.array(img.convert("RGB"))
    # Masque des pixels non-blancs
    mask = np.any(img_array < threshold, axis=2)
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any() or not cols.any():
        return img  # image entièrement blanche, on la laisse
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    # Petit padding de 2px pour ne pas couper les bords de la carte
    pad = 2
    rmin = max(0, rmin - pad)
    rmax = min(img_array.shape[0] - 1, rmax + pad)
    cmin = max(0, cmin - pad)
    cmax = min(img_array.shape[1] - 1, cmax + pad)
    return img.crop((cmin, rmin, cmax + 1, rmax + 1))

# =====================
# TRAITEMENT IMAGE
# =====================
def process_image(img_path: str, upscaler) -> bytes:
    """Trim + upscale x2 + export PNG → retourne les bytes PNG."""
    img = Image.open(img_path).convert("RGB")

    # 1. Trim bords blancs
    img = trim_white_borders(img)

    # 2. Upscale Real-ESRGAN
    img_np = np.array(img)
    output, _ = upscaler.enhance(img_np, outscale=2)
    img_out = Image.fromarray(output)

    # 3. Export PNG en mémoire
    buf = io.BytesIO()
    img_out.save(buf, format="PNG", optimize=True)
    buf.seek(0)
    return buf.read()

# =====================
# MAIN
# =====================
def main():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Modèle introuvable : {MODEL_PATH}")
        print("   Télécharge-le ici : https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth")
        print("   Et place-le dans : weights/RealESRGAN_x2plus.pth")
        return

    upscaler = init_upscaler()

    # Charger cards.json
    with open(CARDS_JSON, "r", encoding="utf-8") as f:
        cards = json.load(f)

    cards_by_id = {c["cardId"]: c for c in cards}
    updated = 0
    errors = 0

    for set_name in SETS:
        set_dir = os.path.join(DATA_DIR, set_name)
        if not os.path.isdir(set_dir):
            print(f"⚠️  Dossier introuvable : {set_dir}")
            continue

        images = [f for f in os.listdir(set_dir) if f.lower().endswith(".webp")]
        print(f"\n📁 {set_name} — {len(images)} images à traiter")

        for filename in images:
            local_id = os.path.splitext(filename)[0]          # ex: SSR-001
            card_id  = f"{set_name}-{local_id}"               # ex: set1-SSR-001
            img_path = os.path.join(set_dir, filename)

            new_filename  = f"{local_id}.png"
            r2_key_old    = f"{set_name}/{filename}"           # ancien .webp
            r2_key_new    = f"{set_name}/{new_filename}"       # nouveau .png
            new_public_url= f"{PUBLIC_BASE_URL}/{r2_key_new}"

            print(f"  ⚙️  {card_id}...", end=" ", flush=True)

            try:
                # Traitement
                png_bytes = process_image(img_path, upscaler)

                # Upload .png
                s3.put_object(
                    Bucket=BUCKET_NAME,
                    Key=r2_key_new,
                    Body=png_bytes,
                    ContentType="image/png",
                )

                # Supprimer l'ancien .webp sur R2
                try:
                    s3.delete_object(Bucket=BUCKET_NAME, Key=r2_key_old)
                except Exception:
                    pass  # pas grave si déjà absent

                # Mettre à jour cards.json
                if card_id in cards_by_id:
                    cards_by_id[card_id]["image"]     = new_public_url
                    cards_by_id[card_id]["imageHigh"] = new_public_url

                updated += 1
                print(f"✅ {new_filename}")

            except Exception as e:
                errors += 1
                print(f"❌ ERREUR : {e}")

    # Sauvegarder cards.json mis à jour
    with open(CARDS_JSON, "w", encoding="utf-8") as f:
        json.dump(list(cards_by_id.values()), f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Terminé — {updated} images traitées, {errors} erreurs")
    print(f"📄 cards.json mis à jour : {CARDS_JSON}")
    print(f"\n⚠️  N'oublie pas de git push data/senpai-goddess-haven/cards.json !")

if __name__ == "__main__":
    main()
