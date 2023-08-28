import {MigrationInterface, QueryRunner} from "typeorm";

export class IncreasedLengthAgain1693189024094 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" TYPE VARCHAR(512);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" TYPE VARCHAR(255);`);
    }

}