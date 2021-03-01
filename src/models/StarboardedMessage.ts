import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class StarboardedMessage extends Model<StarboardedMessage> {
    @PrimaryKey
    @Column
    originalMessageId!: string;

    @Column
    starboardMessageId!: string;

    @Column
    removed!: number;
}
