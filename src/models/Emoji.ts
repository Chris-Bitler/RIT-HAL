import { Table, Model, PrimaryKey, Column } from "sequelize-typescript";

/**
 * Class modeling an emoji usage row from the database
 */
@Table
export class Emoji extends Model<Emoji> {
    @PrimaryKey
    @Column
    serverId!: string;

    @PrimaryKey
    @Column
    emoji!: string;

    @Column
    num!: number;
}
