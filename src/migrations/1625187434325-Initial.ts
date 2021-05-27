import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1625187434325 implements MigrationInterface {
  name = 'Initial1625187434325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tag_categories" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_ac11cfacbe901b5e31a4fdcc059" UNIQUE ("title"), CONSTRAINT "PK_90a9d52f0910bbd68d78d9de149" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "description" character varying, "category_id" integer NOT NULL, CONSTRAINT "UQ_25cae3ff755adc0abe5ca284092" UNIQUE ("title"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "age" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users_tags_tags" ("users_id" integer NOT NULL, "tags_id" integer NOT NULL, CONSTRAINT "PK_871ec4276c06ba57b67d0ee4d71" PRIMARY KEY ("users_id", "tags_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_e403a25a64f0b781f7d9cdfc04" ON "users_tags_tags" ("users_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_647d2da21fd4880c307815aa64" ON "users_tags_tags" ("tags_id") `);
    await queryRunner.query(
      `ALTER TABLE "users_tags_tags" ADD CONSTRAINT "FK_e403a25a64f0b781f7d9cdfc044" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_tags_tags" ADD CONSTRAINT "FK_647d2da21fd4880c307815aa64b" FOREIGN KEY ("tags_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users_tags_tags" DROP CONSTRAINT "FK_647d2da21fd4880c307815aa64b"`);
    await queryRunner.query(`ALTER TABLE "users_tags_tags" DROP CONSTRAINT "FK_e403a25a64f0b781f7d9cdfc044"`);
    await queryRunner.query(`DROP INDEX "IDX_647d2da21fd4880c307815aa64"`);
    await queryRunner.query(`DROP INDEX "IDX_e403a25a64f0b781f7d9cdfc04"`);
    await queryRunner.query(`DROP TABLE "users_tags_tags"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TABLE "tag_categories"`);
  }
}
