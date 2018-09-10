// Required modules:
// ===========================================
const express = require('express');
const Op = require('sequelize').Op;
const moment = require('moment');
const dateFormat = require('dateformat');

// Create application router:
// ===========================================
const router = express.Router();

// Get the tables from the database:
// ===========================================
const Books = require('../model').Books;
const Loans = require('../model').Loans;
const Patrons = require('../model').Patrons;

// HELPER FUNCTIONS:
// ===========================================
function formatDates( loans ) {
    return {
        return_by: dateFormat(loans.return_by, 'mm/dd/yyyy'),
        loaned_on: dateFormat(loans.loaned_on, 'mm/dd/yyyy'),
        returned_on: dateFormat(loans.returned_on, 'mm/dd/yyyy')
    };
}

function renderLoans( res, req, loans, filter ) {
    Promise.all(loans.map( loan => {
        return Books.findById(loan.book_id, {raw: true}).then( book => { 
            return { ...loan, book };
        });
    })).then( loans => {
        Promise.all(loans.map( loan => {
            return Patrons.findOne({ where: {library_id: loan.patron_id}, raw: true}).then( patron => {
                return {
                    ...loan, 
                    patron,
                    loaned_on: dateFormat(loan.loaned_on, 'mm/dd/yyyy'),
                    return_by: dateFormat(loan.return_by, 'mm/dd/yyyy'),
                    returned_on: dateFormat(loan.returned_on, 'mm/dd/yyyy')
                };
            });
        })).then( loans => {
            res.render('loans', {loans, filter});
        });
    });
}

// Create a route for the root urls get request.
router.get('/', ( req, res ) => {
    res.render('home'); // Render the home.pug file.
});

// Create a route for the '/books' urls get request.
router.get('/books', ( req, res ) => {
    const filter = req.query.filter; // Get the filter from the query string.

    if(filter === 'all') {
        // Go through the database and get each book.
        Books.findAll({ order: [['title', 'ASC']], raw: true }).then( books => {
            res.render('books', {books, filter: 'All'});
        });
    } else if(filter === 'checked_out') {
        // Go through the database and get each book that's been checked out.
        Books.findAll({ where: { checked_out: true }, order: [['title', 'ASC']], raw: true }).then( books => {
            res.render('books', {books, filter: 'Checked Out'});
        });
    } else if(filter === 'overdue') {
        // Go through the database and get each loan that's overdue.
        Loans.findAll({ where: {
            return_by: {
                [Op.lt]: moment().toDate()
            },
            checked_out: true
        }, raw: true }).then( loans => {
            Promise.all(loans.map( loan => {
                return Books.findOne({ where: { checked_out: true, id: loan.book_id }, raw: true }).then( book => book );
            })).then( books => {
                res.render('books', {books, filter: 'Overdue'});
            });
        });
    }
});

// Create a route for the '/books/details/:id' urls get request.
router.get('/books/details/:id', ( req, res ) => {
    // Find the specific book in the books table by it's id
    Books.findById(req.params.id, {raw: true}).then( book => {
        if(book) {
            res.locals.book = book; // Send the book as a local.
            // Find the correct loan and patron row.
            Loans.findAll({
                where: {
                    book_id: book.id
                },
                order: [['loaned_on', 'ASC']],
                raw: true
            }).then( loans => {
                // Iterate through each loan and get the correct patron to go with it.
                Promise.all(loans.map( loan => {
                    return Patrons.findOne({
                        where: {
                            library_id: loan.patron_id
                        },
                        raw: true
                    }).then( patron => {
                        return {
                            ...loan,
                            patron,
                            ...formatDates( loan )
                        }
                    });
                })).then( loans => {
                    res.locals.loans = loans;
                    res.render('book_details');
                });
            });
        }
    });
});

router.post('/books/details/:id', ( req, res ) => {
    Books.update(req.body, {returning: true, where: {id: req.params.id}}).then( () => {
        res.redirect('/books?filter=all');
    })
});

// Create a route for the '/books/new' urls get request.
router.get('/books/new', ( req, res ) => {
    res.render('new_book', { book: '' }); // Render the new_book.pug file.
});

// Create a route for the '/books/new' urls post request.
router.post('/books/new', ( req, res ) => {
    // Create a new book and append it to the library database.
    Books.create(req.body).then( book => {
        res.redirect('/books/details/' + book.id); // Redirect user to the books details page.
    }).catch( err => {
        if(err.name === 'SequelizeValidationError') {
            res.render('new_book', {book: Books.build(req.body), errors: err.errors});
        } else {
            throw err;
        }
    });
});

// Create a route for the 'books/return/:id' urls get request.
router.get('/books/return/:id', ( req, res ) => {
    const id = req.params.id; // Get the id parameter from the url.
    Books.findById(id, {raw: true}).then( book => {
        // Make sure that the book being returned has been checked out.
        if (book.checked_out) {
            // Send locals to page.
            res.locals.book = book;
            // Find the corrosponding loan and use that to find the corresponding patron
            Loans.findOne({ where: {book_id: id, returned_on: null}, raw: true}).then( loan => {
                res.locals.loan = {
                    ...loan,
                    ...formatDates( loan )
                };
                Patrons.findOne({ where: {library_id: loan.patron_id}, raw: true}).then( patron => {
                    res.locals.patron = patron;
                    const now = new Date();
                    res.locals.returned_on = dateFormat(now, 'mm/dd/yyyy');
                    res.render('book_return'); // Render the book_return.pug file.
                });
            });
        } else {
            // Create a new error to let user know the book can't be returned.
            const err = new Error(`Sorry, that book hasn't been checked out.`);
            err.status = 500; // Add a status code of 500.
            res.locals.error = err; // Send the locals to the page.

            res.render('error'); // Render the error.pug file.
        }
    })
});

// Create a route for the '/book/return/:id' post request.
router.post('/books/return/:id', ( req, res ) => {
    const id = req.params.id; // Get the id parameter from the url.

    // Find the loan with the corresponding book id.
    Loans.findAll({ where: { book_id: id }, raw: true}).then( loan => {
        // Make sure that the book can be returned.
        if(!loan.returned_on) {
            Loans.update({...req.body, checked_out: false}, {returning: true, where: {book_id: id, checked_out: true}}); // Update the loans table.
            Books.update({ checked_out: false }, {returning: true, where: {id}}); // Update the books table.
        }
    }).then( () => res.redirect('/books?filter=all'));
});

// Create a route for the '/patrons' get request.
router.get('/patrons', ( req, res ) => {
    let locals = []; // Initialize empty array to hold locals.
    Patrons.findAll({ order: [['last_name', 'ASC']] }).then( patrons => {
        patrons.forEach( patron => locals.push(patron.dataValues) );
    }).then( () => {
        res.render('patrons', {patrons: locals}); // Render patrons.pug file.
    });
});

// Create a route for the '/patrons/details/:id' get request.
router.get('/patrons/details/:id', ( req, res ) => {
    const id = req.params.id; // Get the id parameter from the url.
    Patrons.findById(id, {raw: true}).then( patron => {
        // Send the patrons information to the webpage.
        res.locals.patron = patron;
        // Next find all of the patrons loans.
        Loans.findAll({
            order: [['loaned_on', 'DESC']],
            where: {patron_id: patron.library_id},
            raw: true
        }).then( loans => {
            Promise.all( loans.map( loan => {
                return Books.findById(loan.book_id, { raw: true }).then( book => {
                    return {
                        ...loan,
                        book,
                        ...formatDates( loan )
                    };
                });
            })).then( loans => {
                console.log(loans);
                res.render('patron_details', {loans}); // Render the patron_details.pug file.
            });
        });
    });
});

// Create a route for the '/patrons/details/:id' post request.
router.post('/patrons/details/:id', (req, res) => {
    const id = req.params.id; // Get the id of the patron.
    // Update the patron.
    Patrons.update(req.body, {returning: true, where: { id }}).then( () => {
        res.redirect('/patrons'); // Redirect to the patrons page.
    })
});

// Create a route for the '/patrons/new' get request.
router.get('/patrons/new', ( req, res ) => {
    res.render('new_patron', { patron: '' }); // Render the new_patron.pug file.
});

// Create a route for the '/patrons/new' post request.
router.post('/patrons/new', ( req, res ) => {
    // Create a new patron and append it to the library database.
    Patrons.create(req.body).then( patron => {
        res.redirect('/patrons/details/' + patron.id); // Redirect to the patrons details page.
    }).catch( err => {
        if (err.name === 'SequelizeValidationError') {
            res.render('new_patron', {patron: Patrons.build(req.body), errors: err.errors});
        } else {
            throw err;
        }
    });
});

// Create a route for the '/loans' get request.
router.get('/loans', ( req, res ) => {
    const filter = req.query.filter; // Get the filter from the query string.
    let locals = []; // Initialize an empty array that will hold all of the locals.
    if(filter === 'all') {
        Loans.findAll({ order: [['loaned_on', 'DESC']], raw: true}).then( loans => {
            renderLoans( res, req, loans, 'All' );
        });
    } else if(filter === 'checked_out') {
        Loans.findAll({ order: [['loaned_on', 'DESC']], raw: true, where: {checked_out: true}}).then( loans => {
            renderLoans( res, req, loans, 'Checked Out' );
        })
        res.locals.filter = 'Overdue';
    } else if(filter === 'overdue') {
        Loans.findAll({
            order: [['loaned_on', 'DESC']], 
            where: {
                return_by: {
                    [Op.lt]: moment().toDate()
                },
                checked_out: true
            },
            raw: true
        }).then( loans => {
            renderLoans( res, req, loans, 'Overdue');
        });
    }
});

// Create a route for the '/loans/new' get request.
router.get('/loans/new', ( req, res ) => {

    Patrons.findAll({ order: [['last_name', 'ASC']], raw: true}).then( patrons => {
        // Send evey patron as locals.
        res.locals.patrons = patrons;
    }).then( () => {
        // Find every book that hasn't been checked out.
        Books.findAll({ where: {checked_out: false}, raw: true }).then( books => {
            // Send all of the books as locals.
            res.locals.books = books;
            const now = new Date();
            res.locals.date = dateFormat(now, 'mm/dd/yyyy'); // Get the current date.
            now.setDate(now.getDate() + 7);
            res.locals.return_date = dateFormat(now, 'mm/dd/yyyy'); // Get the return date.
            res.locals.loan = '';
            res.render('new_loan'); // Render the new_loan.pug file.
        });
    });
});

// Create a route for the '/loans/new' post request.
router.post('/loans/new', ( req, res, next ) => {
    // Append a new loan to the loans table in the library database.
    Loans.create( req.body ).then( () => {
        Books.update({ checked_out: true }, {returning: true, where: {id: req.body.book_id}}).then( () => {
            res.redirect('/'); // Redirect to the root url.
        });
    }).catch( err => {
        if(err.name === 'SequelizeValidationError') {
            Patrons.findAll({ order: [['last_name', 'ASC']], raw: true}).then( patrons => {
                // Send evey patron as locals.
                res.locals.patrons = patrons;
            }).then( () => {
                // Find every book that hasn't been checked out.
                Books.findAll({ where: {checked_out: false}, raw: true }).then( books => {
                    // Send all of the books as locals.
                    res.locals.books = books;
                    const now = new Date();
                    res.locals.date = dateFormat(now, 'mm/dd/yyyy'); // Get the current date.
                    now.setDate(now.getDate() + 7);
                    res.locals.return_date = dateFormat(now, 'mm/dd/yyyy'); // Get the return date.
                    res.render('new_loan', {loan: Loans.build(req.body), errors: err.errors, err: true}); // Render the new_loan.pug file.
                });
            });
        } else {
            throw err;
        }
    });
});

// Export the router.
module.exports = router;