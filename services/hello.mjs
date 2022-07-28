export async function getHello(request, reply) {
  const res = await this.querySQL(request, `SELECT * from testusers`);
  return res.rows;
}

export function postHello(request, reply) {
  return "hello world post";
}