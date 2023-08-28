import {MigrationInterface, QueryRunner} from "typeorm";

export class IncreasePasswordLength1632563800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" TYPE VARCHAR(255);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" TYPE VARCHAR(45);`);
    }

}
