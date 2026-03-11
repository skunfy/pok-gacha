import { readFileSync, writeFileSync } from 'fs'

const PUBLIC_URL = 'https://pub-cfc80b7222554c93af60801fac482eb1.r2.dev'

function cleanFilename(name) {
  return name.replace(/[^\x00-\x7F]/g, '-').replace(/-+/g, '-')
}

const cards = JSON.parse(readFileSync('./data/unionarena/cards.json', 'utf-8'))

const updated = cards.map(card => {
  const filename = cleanFilename(card.image.split('/').pop())
  const url = `${PUBLIC_URL}/${filename}`
  return { ...card, image: url, imageHigh: url }
})

writeFileSync('./data/unionarena/cards.json', JSON.stringify(updated, null, 2))
console.log(`✅ ${updated.length} cartes mises à jour`)