// Résolution des images : fichier local existant du site si possible, sinon téléchargement
// depuis le CDN Sanity (conversion WebP côté Sanity) vers le dossier de sortie, version bureau + mobile.
// Les pages ne pointent jamais vers cdn.sanity.io (respect de la CSP actuelle : img-src 'self').
import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import path from 'node:path'

const DESKTOP_W = 1280
const MOBILE_W = 640

export async function resolveImage(img, {siteDir, outDir}) {
  if (!img?.file && !img?.url) return null
  if (img.file && existsSync(path.join(siteDir, 'assets/img', img.file))) {
    const m = img.file.replace(/\.webp$/, '-m.webp')
    return {...img, src: `assets/img/${img.file}`, srcM: m !== img.file && existsSync(path.join(siteDir, 'assets/img', m)) ? `assets/img/${m}` : null}
  }
  const base = img.id.replace(/^image-/, '').replace(/-\d+x\d+-\w+$/, '')
  const dir = path.join(outDir, 'assets/img/sanity')
  mkdirSync(dir, {recursive: true})
  const get = async (w, name) => {
    const file = path.join(dir, name)
    if (!existsSync(file)) {
      const res = await fetch(`${img.url}?w=${w}&fm=webp&q=80&fit=max`)
      if (!res.ok) throw new Error(`Téléchargement image impossible (${res.status}) : ${img.url}`)
      writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    }
    return `assets/img/sanity/${name}`
  }
  const scale = Math.min(1, DESKTOP_W / img.w)
  return {
    ...img,
    src: await get(DESKTOP_W, `${base}.webp`),
    srcM: await get(MOBILE_W, `${base}-m.webp`),
    w: Math.round(img.w * scale),
    h: Math.round(img.h * scale),
  }
}

// Remplace en place chaque objet image (repéré par la présence de "file"/"url" + "alt") par sa version résolue.
export async function resolveAll(node, ctx) {
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) node[i] = await resolveAll(node[i], ctx); return node }
  if (node && typeof node === 'object') {
    if ('alt' in node && ('file' in node || 'url' in node) && !node.src) return resolveImage(node, ctx)
    for (const k of Object.keys(node)) node[k] = await resolveAll(node[k], ctx)
  }
  return node
}
