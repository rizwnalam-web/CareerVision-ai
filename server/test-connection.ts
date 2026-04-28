import pgPromise from "pg-promise";

const passwords = ["postgres", "india0612", "", "admin", "password", "12345"];

async function testPasswords() {
  const pgp = pgPromise();

  for (const pwd of passwords) {
    try {
      const db = pgp({
        host: "localhost",
        port: 5432,
        database: "postgres",
        user: "postgres",
        password: pwd,
      });

      await db.one("SELECT NOW()");
      console.log(`✓ SUCCESS! Password is: "${pwd}"`);
      await pgp.end();
      process.exit(0);
    } catch (error: any) {
      console.log(`✗ Failed with password: "${pwd}"`);
    }
  }

  console.log("\n✗ None of the tested passwords worked.");
  console.log("Try running: psql -U postgres -h localhost");
  await pgp.end();
  process.exit(1);
}

testPasswords();
