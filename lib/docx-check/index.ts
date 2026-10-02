import { buildModel, type DocModel } from './model'
import { readZipText } from './unzip'

export { checkDocument, type Issue, type Report, type Requirements } from './check'
export { NotDocxError } from './unzip'

export async function analyzeDocx(buf: ArrayBuffer): Promise<DocModel> {
  const files = await readZipText(buf, (n) => /^word\/[^/]+\.xml$|^word\/theme\/[^/]+\.xml$|^word\/_rels\/document\.xml\.rels$/.test(n))
  return buildModel(files)
}
