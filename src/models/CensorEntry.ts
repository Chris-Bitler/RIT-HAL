import { Column, Model, Table } from 'sequelize-typescript';

/**
 * Class containing config property key/values and the server they belong to
 */
@Table
export class CensorEntry extends Model<CensorEntry> {
    @Column
    serverId!: string;

    @Column
    censoredWord!: string;
}
