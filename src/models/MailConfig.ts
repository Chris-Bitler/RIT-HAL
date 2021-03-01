import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class MailConfig extends Model<MailConfig> {
    @PrimaryKey
    @Column
    serverName!: string;

    @Column
    serverId!: string;

    @Column
    adminChannelId!: string;
}
