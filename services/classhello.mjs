export class ClassHello {

  async get(request, reply) {
    const res = await this.querySQL(request, `SELECT * from testusers`);
    return res.rows;
  }
}