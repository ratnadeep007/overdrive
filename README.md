# Overdrive

A experimental opinionated framework to create rest apis fast.

### Steps:
- Create a new file with js extension
- Add `.env` file with DATABAS_URL for postgres connection
- For functional service:

```js
export async function getHello(request, reply) {
  const res = await this.querySQL(request, `SELECT * from testusers`);
  return res.rows;
}
```
`get`, `post` before function name defines http method type and name of function will be your route.

- For class based service:

```js
export class ClassHello {

  async get(request, reply) {
    const res = await this.querySQL(request, `SELECT * from testusers`);
    return res.rows;
  }
}
```

`get` function inside class defines method type, and class name will be used as route.

`querySQL` is availible in current instance everytime.