import {
    AllowNull,
    Column,
    DataType,
    Model,
    Table
} from 'sequelize-typescript';

@Table
export class Alarm extends Model<Alarm> {
    @Column(DataType.BIGINT)
    lastUsed!: number;

    @Column
    channelId!: string;

    @Column
    messageToSend!: string;

    @AllowNull
    @Column(DataType.INTEGER)
    hours: number | undefined;

    @AllowNull
    @Column(DataType.INTEGER)
    minutes: number | undefined;

    @AllowNull
    @Column(DataType.BIGINT)
    date: number | undefined;

    @AllowNull
    @Column(DataType.BOOLEAN)
    sent: boolean | undefined;

    @Column
    type!: string;

    @Column
    serverId!: string;
}
