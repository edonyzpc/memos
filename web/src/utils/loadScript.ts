type ScriptAttributes = Record<string, string>;

interface LoadScriptOptions {
  id?: string;
  async?: boolean;
  defer?: boolean;
  attrs?: ScriptAttributes;
}

const scriptPromises = new Map<string, Promise<void>>();

export const loadScript = (src: string, options: LoadScriptOptions = {}) => {
  const { id, async = true, defer = false, attrs } = options;

  if (id) {
    const existing = document.getElementById(id);
    if (existing) {
      return Promise.resolve();
    }
  }

  const cached = scriptPromises.get(src);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    script.defer = defer;
    if (id) {
      script.id = id;
    }
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        script.setAttribute(key, value);
      }
    }
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromises.delete(src);
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
};
