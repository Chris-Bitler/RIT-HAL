import { Column, DataType, Model, Table } from "sequelize-typescript";

/**
 * Model representing a user punishment (mute/ban/warning/kick)
 */
@Table
export class Punishment extends Model<Punishment> {
    @Column
    userId!: string;

    @Column
    userName!: string;

    @Column
    punisherId!: string;

    @Column
    punisherName!: string;

    @Column
    type!: string;

    @Column
    reason!: string;

    @Column
    active: boolean = false;

    @Column
    serverId!: string;

    @Column(DataType.BIGINT)
    expiration!: number;
}
