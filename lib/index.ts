import Fastify from 'fastify';
import pg from 'pg';
import 'dotenv/config';
import fs from 'fs';
import { createClient } from 'redis';

export class Overdrive {
  fastify: any;
  db: pg.Client;
  cache: any;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      this.db = new pg.Client(dbUrl);
      this.db.connect();
    }

    const env = process.env.ENV;
    this.fastify = Fastify({
      logger: env === 'dev' ? true : false,
    });

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.cache = createClient({ url: redisUrl });
      this.cache.on('error', (err) => console.log('Redis Client Error', err));
      this.cache.connect();
    }

    console.log('Overdrive Initialized');
  }

  public async start() {
    const serviceNames = this.serviceFileDiscoverer();
    const importedServices = await this.importers(serviceNames);
    this.registerer(importedServices);

    this.fastify.listen({ port: 3000 }, function (err, address) {
      if (err) {
        this.fastify.log.error(err);
        process.exit(1);
      }
    });
  }

  public async queryPg(query: string): Promise<pg.QueryResult<any>> {
    return this.db.query(query);
  }

  private async importers(serviceNames: string[]) {
    let imports = new Map();

    for (const serviceName of serviceNames) {
      const importPath = `../services/${serviceName}`;
      const obj = await import(importPath);
      const keys = Object.keys(obj);
      for (const key of keys) {
        // check if functional service as it will contain method type
        // else its a class based component
        const methods = ['get', 'post', 'put', 'delete'];
        const matches = methods.find(el => {
          if (key.includes(el)) {
            return true;
          }
        });
        if (matches) {
          imports.set(key, obj[key]);
        } else {
          obj[key].prototype.queryPg = this.queryPg;
          const a = new obj[key]();
          a['queryPg'] = this.queryPg;
          if (a['get']) {
            imports.set(`get${key}`, a['get']);
          }
        }
      }
    }

    console.log(imports);

    return imports;
  }

  private registerer(importedServics) {
    const routes = new Map();
    this.fastify.decorate('querySQL', async (request, queryString, value) => await this.queryPg(queryString));
    this.fastify.decorate('cacheSet', async (request, key, value) => await this.cache.set(key, value));
    this.fastify.decorate('cacheGet', async (request, key, value) => await this.cache.get(key, value));
    importedServics.forEach((value, key) => {
      if (key.includes('get')) {
        let k = `/${key.replace('get', '').toLowerCase()}`;
        this.fastify.get(k, value);
        this.routePresentOrAdd(k, 'get', routes);
      } else if (key.includes('post')) {
        let k = `/${key.replace('post', '').toLowerCase()}`;
        this.fastify.post(k, value);
        this.routePresentOrAdd(k, 'post', routes);
      }
    });

    console.log('Registered Routes');

    routes.forEach((value, key) => {
      console.log(`${key} -> ${value}`);
    });
  }

  private routePresentOrAdd(key: string, method: string, routes: Map<any, any>) {
    if (routes.has(key)) {
      let methods = routes.get(key);
      methods.push(method);
      routes.set(key, methods);
    } else {
      let methods = [method];
      routes.set(key, methods);
    }
  }

  private serviceFileDiscoverer(): string[] {
    let serviceNames: string[] = [];

    fs.readdirSync('./services').forEach(file => {
      serviceNames.push(file.replace('.js', ''));
    });

    return serviceNames;
  }
}