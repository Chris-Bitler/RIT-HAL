import {Table, Model, PrimaryKey, NotNull, Column} from "sequelize-typescript";

@Table
export class Emoji extends Model<Emoji> {
    @PrimaryKey
    @NotNull
    serverId!: string;

    @PrimaryKey
    @NotNull
    @Column
    emoji!: string;

    @Column
    num!: number;
}