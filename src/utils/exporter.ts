import JSZip from 'jszip';
import { Project } from '../types';

export async function exportProjectToZip(project: Project): Promise<void> {
  const zip = new JSZip();

  const fileEntries = Object.entries(project.files || {});
  if (fileEntries.length === 0) {
    console.warn('O projeto não tem ficheiros para exportar.');
    return;
  }

  for (const [path, fileObj] of fileEntries) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const content = typeof fileObj === 'string' ? fileObj : fileObj.content;
    zip.file(cleanPath, content);
  }

  // Add README
  const readmeContent = `# ${project.name || 'Projeto IMCH'}
${project.description || 'Criado com a plataforma IMCH AI Developer.'}

Gerado em: ${new Date(project.createdAt || Date.now()).toLocaleString('pt-PT')}
Desenvolvido por: IMCH Soluções Digitais
`;
  zip.file('README.md', readmeContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (project.name || 'projeto-imch')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  link.download = `${safeName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
