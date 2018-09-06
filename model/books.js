// Create and export books table model:
module.exports = function(sequelize, DataTypes) {
    // Create the Books model:
    const Books = sequelize.define('Books', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Title is a required field.'
                }
            }
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Author is a required field.'
                }
            }
        },
        checked_out: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        genre: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Genre is a required field.'
                }
            }
        },
        first_published: {
            type: DataTypes.STRING,
        }
    }, 
    {
        timestamps: false
    });
    // Export the Books model:
    return Books;
}