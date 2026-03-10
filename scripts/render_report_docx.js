const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const REPORT_MD = path.join(ROOT, 'REPORT.md');
const OUT_DOCX = path.join(ROOT, 'REPORT.docx');
const TMP_DIR = path.join(ROOT, 'tmp_report');
const PUPPETEER_CONFIG = path.join(TMP_DIR, 'puppeteer.json');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const readLines = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/);

const renderMermaidToPng = (mmdFile, outPng) => {
  const mmdcCmd = path.join(ROOT, 'node_modules', '.bin', 'mmdc.cmd');
  const cmd = `"${mmdcCmd}" -i "${mmdFile}" -o "${outPng}" -b transparent -p "${PUPPETEER_CONFIG}"`;
  execFileSync(cmd, { stdio: 'inherit', shell: true });
};

const headingForLine = (line) => {
  if (line.startsWith('# ')) return { level: HeadingLevel.TITLE, text: line.slice(2) };
  if (line.startsWith('## ')) return { level: HeadingLevel.HEADING_1, text: line.slice(3) };
  if (line.startsWith('### ')) return { level: HeadingLevel.HEADING_2, text: line.slice(4) };
  if (line.startsWith('#### ')) return { level: HeadingLevel.HEADING_3, text: line.slice(5) };
  return null;
};

const isMermaidStart = (line) => line.trim() === '```mermaid';
const isCodeEnd = (line) => line.trim() === '```';

const buildDocx = (lines, diagramPaths) => {
  const children = [];
  let diagramIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isMermaidStart(line)) {
      // Insert diagram image
      const imgPath = diagramPaths[diagramIndex++];
      const imgBytes = fs.readFileSync(imgPath);
      children.push(
        new Paragraph({
          children: [new ImageRun({ data: imgBytes, transformation: { width: 560, height: 320 } })],
        })
      );
      // Skip mermaid block lines
      while (i < lines.length && !isCodeEnd(lines[i])) i++;
      continue;
    }

    const heading = headingForLine(line);
    if (heading) {
      children.push(new Paragraph({ text: heading.text, heading: heading.level }));
      continue;
    }

    if (!line.trim()) {
      children.push(new Paragraph(''));
      continue;
    }

    children.push(
      new Paragraph({
        children: [new TextRun(line)],
      })
    );
  }

  return new Document({ sections: [{ children }] });
};

const main = async () => {
  ensureDir(TMP_DIR);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const puppeteerConfig = {
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  fs.writeFileSync(PUPPETEER_CONFIG, JSON.stringify(puppeteerConfig, null, 2));
  const lines = readLines(REPORT_MD);

  // Extract and render mermaid diagrams
  const diagramPaths = [];
  let current = [];
  let inMermaid = false;
  let diagramCount = 0;

  for (const line of lines) {
    if (isMermaidStart(line)) {
      inMermaid = true;
      current = [];
      continue;
    }
    if (inMermaid && isCodeEnd(line)) {
      diagramCount += 1;
      const mmdFile = path.join(TMP_DIR, `diagram-${diagramCount}.mmd`);
      const outPng = path.join(TMP_DIR, `diagram-${diagramCount}.png`);
      fs.writeFileSync(mmdFile, current.join('\n'), 'utf8');
      renderMermaidToPng(mmdFile, outPng);
      diagramPaths.push(outPng);
      inMermaid = false;
      current = [];
      continue;
    }
    if (inMermaid) current.push(line);
  }

  const doc = buildDocx(lines, diagramPaths);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT_DOCX, buffer);
  console.log(`Generated: ${OUT_DOCX}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
