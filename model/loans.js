// Create and export loans table model:
module.exports = function(sequelize, DataTypes) {
    // Create the Loans model:
    const Loans = sequelize.define('Loans', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        book_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            refrences: {
                model: 'Books',
                key: 'id'
            },
            validate: {
                notEmpty: {
                    msg: 'Please select a book.'
                }
            }
        },
        patron_id: {
            type: DataTypes.STRING,
            allowNull: false,
            refrences: {
                model: 'Patrons',
                key: 'patron_id'
            },
            validate: {
                notEmpty: {
                    msg: 'Please select a patron.'
                }
            }
        },
        loaned_on: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: {
                    msg: 'Please enter a valid date for loan date. (mm/dd/yyyy)'
                }
            }
        },
        return_by: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: {
                    msg: 'Please enter a valid date for return date. (mm/dd/yyyy)'
                }
            }
        },
        checked_out: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        returned_on: DataTypes.DATE
    });
    // Export the Loans model:
    return Loans;
}