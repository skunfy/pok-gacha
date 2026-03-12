import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join, extname } from 'path'

const ACCOUNT_ID = '16f7b055e3110c17f066c07bcb085fb6'
const ACCESS_KEY_ID = '25285551240879e692117ef373b8a173'
const SECRET_ACCESS_KEY = 'fb1b9ce6dd4476ec79d3146391c9d21fd4a01ec5d364c109070f072126b72448'
const BUCKET = 'senpaigodesshaven'
const PUBLIC_URL = 'https://pub-e8c5071de0564bea983e932d113a1c89.r2.dev'
const IMAGES_BASE_DIR = './data/senpai-goddess-haven'

const SETS = [
  { id: 'set1', name: 'Senpai Goddess Haven 1', folder: 'set1' },
  { id: 'set2', name: 'Senpai Goddess Haven 2', folder: 'set2' },
  { id: 'set3', name: 'Senpai Goddess Haven 3', folder: 'set3' },
  { id: 'set4', name: 'Senpai Goddess Haven 4', folder: 'set4' },
  { id: 'set5', name: 'Senpai Goddess Haven 5', folder: 'set5' },
  { id: 'set6', name: 'Senpai Goddess Haven 6', folder: 'set6' },
]

// Rarity order (higher = rarer)
const RARITY_ORDER = {
  SR: 1, SSR: 2, UR: 3, ZR: 4, SP: 5, CR: 6, NX: 7, OL: 8,
  MR: 9, XR: 10, SSP: 11, SSS: 12, MAX: 13, ECG: 1, ETR: 2,
  LSP: 5, ESR: 2, SER: 1, SES: 1, SEX: 3, SEXR: 4, SLR: 3,
  TCR: 2, TCX: 3, SXR: 4, CP: 1, PZL1: 1, PZL2: 2
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

function getFilesRecursive(dir) {
  let files = []
  try {
    const items = readdirSync(dir)
    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        files = files.concat(getFilesRecursive(fullPath))
      } else if (['.webp', '.png', '.jpg', '.jpeg'].includes(extname(item).toLowerCase())) {
        files.push(fullPath)
      }
    }
  } catch (e) {}
  return files
}

function parseCardId(filename) {
  // ECG-001.webp → rarity=ECG, number=1
  const match = filename.match(/^([A-Z0-9]+)-(\d+)\.\w+$/)
  if (match) return { rarity: match[1], number: parseInt(match[2]) }
  return { rarity: 'SR', number: 0 }
}

async function uploadFile(localPath, key, contentType = 'image/webp') {
  const body = readFileSync(localPath)
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
}

async function main() {
  const cards = []
  const sets = []
  let totalUploaded = 0
  let totalErrors = 0

  for (const setInfo of SETS) {
    const setDir = join(IMAGES_BASE_DIR, setInfo.folder)
    const files = getFilesRecursive(setDir)

    if (files.length === 0) {
      console.log(`⚠️  ${setInfo.name} — dossier vide ou introuvable, skip`)
      continue
    }

    console.log(`\n📦 ${setInfo.name} — ${files.length} images`)

    sets.push({
      id: setInfo.id,
      name: setInfo.name,
      game: 'senpaigodesshaven',
      cardCount: files.length,
    })

    for (const filePath of files) {
      const filename = filePath.split(/[\\/]/).pop()
      const ext = extname(filename).toLowerCase()
      const key = `${setInfo.id}/${filename}`
      const contentType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg'

      try {
        await uploadFile(filePath, key, contentType)
        totalUploaded++

        const { rarity, number } = parseCardId(filename)
        const imageUrl = `${PUBLIC_URL}/${key}`

        cards.push({
          game: 'senpaigodesshaven',
          setId: setInfo.id,
          setName: setInfo.name,
          cardId: `${setInfo.id}-${filename.replace(ext, '')}`,
          localId: filename.replace(ext, ''),
          rarity,
          number,
          image: imageUrl,
          imageHigh: imageUrl,
        })

        if (totalUploaded % 20 === 0) process.stdout.write(`  ✅ ${totalUploaded} uploadées...\r`)
      } catch (e) {
        totalErrors++
        console.error(`  ❌ ${filename}: ${e.message}`)
      }
    }

    console.log(`  ✅ ${files.length} images uploadées pour ${setInfo.name}`)
  }

  // Sort cards by setId then rarity then number
  cards.sort((a, b) => {
    if (a.setId !== b.setId) return a.setId.localeCompare(b.setId)
    if (a.rarity !== b.rarity) return (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0)
    return a.number - b.number
  })

  writeFileSync(
    join(IMAGES_BASE_DIR, 'cards.json'),
    JSON.stringify(cards, null, 2)
  )
  writeFileSync(
    join(IMAGES_BASE_DIR, 'sets.json'),
    JSON.stringify(sets, null, 2)
  )

  console.log(`\n🎉 Terminé !`)
  console.log(`   ✅ ${totalUploaded} images uploadées`)
  console.log(`   ❌ ${totalErrors} erreurs`)
  console.log(`   📄 ${cards.length} cartes dans cards.json`)
  console.log(`   📄 ${sets.length} sets dans sets.json`)
}

main().catch(console.error)
