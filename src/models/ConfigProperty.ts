import { Column, Model, Table } from "sequelize-typescript";

/**
 * Class containing config property key/values and the server they belong to
 */
@Table
export class ConfigProperty extends Model<ConfigProperty> {
    @Column
    serverId!: string;

    @Column
    key!: string;

    @Column
    value!: string;

    static getServerProperty = async (property: string, serverId: string) => {
        return ConfigProperty.findOne({
            where: {
                key: property,
                serverId
            }
        });
    };
}
