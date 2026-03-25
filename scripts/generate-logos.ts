import sharp from "sharp"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import toIco from "to-ico"

const __root = join(import.meta.dirname, "..")
const SOURCE = join(__root, "001.jpeg")

interface Spec {
  name: string
  width?: number
  height?: number
  dark?: boolean
  light?: boolean
  ico?: boolean
}

interface Group {
  dir: string
  files: Spec[]
}

const specs: Group[] = [
  {
    dir: join(__root, "packages/ui/src/components"),
    files: [
      { name: "logo-full.png", width: 936, height: 168 },
      { name: "logo-full-dark.png", width: 936, height: 168, dark: true },
      { name: "logo-full-light.png", width: 936, height: 168, light: true },
      { name: "logo-mark.png", width: 64, height: 80 },
      { name: "logo-mark-dark.png", width: 64, height: 80, dark: true },
      { name: "logo-mark-light.png", width: 64, height: 80, light: true },
      { name: "logo-splash.png", width: 320, height: 400 },
      { name: "logo-splash-dark.png", width: 320, height: 400, dark: true },
      { name: "logo-splash-light.png", width: 320, height: 400, light: true },
    ],
  },
  {
    dir: join(__root, "packages/console/app/src/asset/brand"),
    files: [
      { name: "opencode-logo-dark.png", width: 480, height: 600 },
      { name: "opencode-logo-light.png", width: 480, height: 600 },
      { name: "opencode-logo-dark-square.png", width: 600, height: 600 },
      { name: "opencode-logo-light-square.png", width: 600, height: 600 },
      { name: "opencode-wordmark-dark.png", width: 1282, height: 230 },
      { name: "opencode-wordmark-light.png", width: 1280, height: 230 },
      { name: "opencode-wordmark-simple-dark.png", width: 1282, height: 230 },
      { name: "opencode-wordmark-simple-light.png", width: 1280, height: 230 },
      { name: "preview-opencode-dark.png", width: 40, height: 40 },
      { name: "preview-opencode-logo-dark-square.png", width: 400, height: 400 },
      { name: "preview-opencode-logo-dark.png", width: 2400, height: 1350 },
      { name: "preview-opencode-logo-light-square.png", width: 400, height: 400 },
      { name: "preview-opencode-logo-light.png", width: 2400, height: 1350 },
      { name: "preview-opencode-wordmark-dark.png", width: 2400, height: 1350 },
      { name: "preview-opencode-wordmark-light.png", width: 2400, height: 1350 },
      { name: "preview-opencode-wordmark-simple-dark.png", width: 2400, height: 1350 },
      { name: "preview-opencode-wordmark-simple-light.png", width: 2400, height: 1350 },
    ],
  },
  {
    dir: join(__root, "packages/console/mail/emails/templates/static"),
    files: [
      { name: "zen-logo.png", width: 511, height: 149 },
      { name: "logo.png", width: 669, height: 120 },
    ],
  },
  {
    dir: join(__root, "packages/ui/src/assets/favicon"),
    files: [
      { name: "favicon-96x96.png", width: 96, height: 96 },
      { name: "favicon-96x96-v3.png", width: 96, height: 96 },
      { name: "favicon.ico", width: 256, height: 256 },
      { name: "favicon-v3.ico", width: 256, height: 256 },
    ],
  },
  {
    dir: join(__root, "packages/app/public"),
    files: [
      { name: "favicon-96x96.png", width: 96, height: 96 },
      { name: "favicon-96x96-v3.png", width: 96, height: 96 },
      { name: "favicon.ico", width: 256, height: 256 },
      { name: "favicon-v3.ico", width: 256, height: 256 },
    ],
  },
  {
    dir: join(__root, "packages/web/public"),
    files: [
      { name: "favicon-96x96.png", width: 96, height: 96 },
      { name: "favicon-96x96-v3.png", width: 96, height: 96 },
      { name: "favicon.ico", width: 256, height: 256 },
      { name: "favicon-v3.ico", width: 256, height: 256 },
    ],
  },
  {
    dir: join(__root, "packages/enterprise/public"),
    files: [
      { name: "favicon-96x96.png", width: 96, height: 96 },
      { name: "favicon-96x96-v3.png", width: 96, height: 96 },
      { name: "favicon.ico", width: 256, height: 256 },
      { name: "favicon-v3.ico", width: 256, height: 256 },
    ],
  },
  {
    dir: join(__root, "packages/console/app/public"),
    files: [
      { name: "favicon-96x96.png", width: 96, height: 96 },
      { name: "favicon-96x96-v3.png", width: 96, height: 96 },
      { name: "favicon.ico", width: 256, height: 256 },
      { name: "favicon-v3.ico", width: 256, height: 256 },
    ],
  },
]

async function generateLogo(spec: Spec, dir: string) {
  const metadata = await sharp(SOURCE).metadata()
  let pipeline = sharp(SOURCE)

  if (spec.width && spec.height && metadata.width && metadata.height) {
    const scale = Math.max(spec.width / metadata.width, spec.height / metadata.height)
    const scaledWidth = Math.round(metadata.width * scale)
    const scaledHeight = Math.round(metadata.height * scale)

    pipeline = pipeline.resize(scaledWidth, scaledHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })

    if (spec.width / scaledWidth < 0.8 || spec.height / scaledHeight < 0.8) {
      const left = Math.round((scaledWidth - spec.width) / 2)
      const top = Math.round((scaledHeight - spec.height) / 2)
      pipeline = pipeline.extract({ left, top, width: spec.width, height: spec.height })
    } else {
      pipeline = pipeline.resize(spec.width, spec.height)
    }
  }

  if (spec.dark) {
    pipeline = pipeline.modulate({ brightness: 0.7, saturation: 0.5 })
  } else if (spec.light) {
    pipeline = pipeline.modulate({ brightness: 1.2, saturation: 0.8 })
  }

  const destPath = join(dir, spec.name)
  await mkdir(dir, { recursive: true })

  if (spec.name.endsWith(".ico")) {
    const sizes = [16, 32, 48, 256]
    const buffers = await Promise.all(sizes.map((size) => sharp(SOURCE).resize(size, size).png().toBuffer()))
    const ico = await toIco(buffers)
    await writeFile(destPath, ico)
  } else {
    await pipeline.png().toFile(destPath)
  }
  console.log(`Generated: ${spec.name}`)
}

async function main() {
  console.log("Generating logos from:", SOURCE)
  for (const group of specs) {
    for (const spec of group.files) {
      await generateLogo(spec, group.dir)
    }
  }
  console.log("Done!")
}

main().catch(console.error)
