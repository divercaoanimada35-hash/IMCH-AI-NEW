import { QualityAuditResult } from '../types';

export class ProjectQualityEngine {
  static auditProject(
    files: Record<string, string | { content: string }> = {},
    blueprint?: any
  ): { auditResult: QualityAuditResult; correctedFiles: Record<string, string> } {
    const issues: QualityAuditResult['issues'] = [];
    const passedChecks: string[] = [];
    const correctedFiles: Record<string, string> = {};

    let score = 100;

    const fileEntries = Object.entries(files).map(([path, data]) => {
      const content = typeof data === 'string' ? data : (data?.content || '');
      return { path, content };
    });

    if (fileEntries.length === 0) {
      issues.push({
        type: 'error',
        message: 'O projeto não possui ficheiros gerados.'
      });
      score -= 50;
    }

    const hasIndexHtml = fileEntries.some((f) => f.path.toLowerCase() === 'index.html');
    if (hasIndexHtml) {
      passedChecks.push('Ficheiro raiz index.html presente');
    } else {
      issues.push({
        type: 'error',
        message: 'Ficheiro index.html não encontrado na raiz.',
        file: 'index.html'
      });
      score -= 30;
    }

    for (const { path, content } of fileEntries) {
      let cleanContent = content;

      // Check forbidden patterns
      if (/lorem\s+ipsum/i.test(cleanContent)) {
        issues.push({
          type: 'warning',
          message: 'Texto de preenchimento detetado e removido do ficheiro.',
          file: path
        });
        cleanContent = cleanContent.replace(/lorem\s+ipsum[^\.<>]*[\.<>]/gi, 'Soluções digitais de alta performance e tecnologia de ponta.');
        score -= 5;
      }

      if (path.endsWith('.html')) {
        if (!cleanContent.includes('<!DOCTYPE html>') && !cleanContent.includes('<!doctype html>')) {
          issues.push({
            type: 'warning',
            message: 'Declaração <!doctype html> ausente no ficheiro HTML.',
            file: path
          });
          cleanContent = '<!doctype html>\n' + cleanContent;
          score -= 5;
        } else {
          passedChecks.push(`Declaração DOCTYPE válida em ${path}`);
        }

        if (!cleanContent.includes('viewport')) {
          issues.push({
            type: 'warning',
            message: 'Meta tag viewport ausente para suporte móvel responsivo.',
            file: path
          });
          score -= 5;
        } else {
          passedChecks.push(`Meta viewport configurado em ${path}`);
        }
      }

      correctedFiles[path] = cleanContent;
    }

    if (issues.length === 0) {
      passedChecks.push('Verificação de integridade e qualidade do código concluída com sucesso');
    }

    return {
      auditResult: {
        score: Math.max(0, Math.min(100, score)),
        issues,
        passedChecks
      },
      correctedFiles
    };
  }
}
