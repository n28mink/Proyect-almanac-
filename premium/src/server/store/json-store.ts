import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '../env';

/**
 * Almacén de documentos JSON (adaptador por defecto). Escritura atómica (tmp + rename) y exclusión mutua por documento.
 * Si el sistema de archivos es de solo lectura (p. ej. Vercel) cae a memoria — en ese caso sustituir por una base de
 * datos real implementando la misma interfaz `DocumentStore`.
 */
export interface DocumentStore {
  read<T>(name: string, fallback: T): Promise<T>;
  update<T>(name: string, fallback: T, mutate: (current: T) => T | Promise<T>): Promise<T>;
}

class JsonFileStore implements DocumentStore {
  private memory = new Map<string, unknown>();
  private locks = new Map<string, Promise<unknown>>();
  private readOnly = false;

  private file(name: string) {
    return path.join(process.cwd(), env().DATA_DIR, `${name}.json`);
  }

  async read<T>(name: string, fallback: T): Promise<T> {
    if (this.memory.has(name)) return structuredClone(this.memory.get(name) as T);
    try {
      const raw = await fs.readFile(this.file(name), 'utf8');
      const data = JSON.parse(raw) as T;
      this.memory.set(name, data);
      return structuredClone(data);
    } catch {
      return structuredClone(fallback);
    }
  }

  async update<T>(name: string, fallback: T, mutate: (current: T) => T | Promise<T>): Promise<T> {
    const previous = this.locks.get(name) ?? Promise.resolve();
    const run = previous.then(async () => {
      const current = await this.read<T>(name, fallback);
      const next = await mutate(current);
      this.memory.set(name, structuredClone(next));
      if (!this.readOnly) {
        try {
          const target = this.file(name);
          await fs.mkdir(path.dirname(target), { recursive: true });
          const tmp = `${target}.${process.pid}.tmp`;
          await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
          await fs.rename(tmp, target);
        } catch {
          this.readOnly = true;
          console.warn('[store] Sistema de archivos no escribible: los datos viven solo en memoria. Configura una base de datos.');
        }
      }
      return next;
    });
    this.locks.set(name, run.catch(() => undefined));
    return run;
  }
}

const globalStore = globalThis as unknown as { __cloverStore?: DocumentStore };
export const store: DocumentStore = (globalStore.__cloverStore ??= new JsonFileStore());
