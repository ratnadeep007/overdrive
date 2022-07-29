export async function getHello(request, reply) {
  const res = await this.querySQL(request, `SELECT * from testusers`);
  try {
    await this.cacheSet(request, 'users', JSON.stringify(res.rows));
  } catch (err) {
    console.log(err);
  }
  console.log(this.cacheSet);
  return res.rows;
}

export function postHello(request, reply) {
  return "hello world post";
}