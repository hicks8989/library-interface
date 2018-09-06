// Create and export patrons table model:
module.exports = function(sequelize, DataTypes) {
    const Patrons = sequelize.define('Patrons', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'First name is a required field.'
                }
            }
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Last name is a required field.'
                }
            }
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Address is a required field.'
                }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: {
                    msg: 'Email address invalid.'
                }
            }
        },
        library_id: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Library id is a required field.'
                }
            }
        },
        zip_id: {
            type: DataTypes.INTEGER,
            isNull: false,
            validate: {
                notEmpty: {
                    msg: 'Zip code is a required field.'
                }
            }
        }
    }, {
        timestamps: false
    });
    // Export the patrons model.
    return Patrons;
}