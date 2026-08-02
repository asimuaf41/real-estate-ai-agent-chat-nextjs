import dns from "node:dns";

/**
 * After a Supabase project is paused/restored, some macOS resolvers briefly
 * fail `getaddrinfo` (used by fetch) while `resolve4` still works. Fall back
 * so RAG/memory API routes recover without waiting for full DNS cache expiry.
 */
const originalLookup = dns.lookup.bind(dns);

function lookupWithResolveFallback(hostname, options, callback) {
  let opts = options;
  let cb = callback;

  if (typeof options === "function") {
    cb = options;
    opts = {};
  }

  originalLookup(hostname, opts, (err, address, family) => {
    if (!err) {
      cb(err, address, family);
      return;
    }

    if (err.code !== "ENOTFOUND" && err.code !== "EAI_AGAIN") {
      cb(err, address, family);
      return;
    }

    dns.resolve4(hostname, (resolveErr, addresses) => {
      if (resolveErr || !addresses?.length) {
        cb(err, address, family);
        return;
      }

      const all = Boolean(opts && typeof opts === "object" && opts.all);
      if (all) {
        cb(
          null,
          addresses.map((addr) => ({ address: addr, family: 4 })),
        );
        return;
      }

      cb(null, addresses[0], 4);
    });
  });
}

dns.lookup = lookupWithResolveFallback;

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older Node versions may not support this.
}
