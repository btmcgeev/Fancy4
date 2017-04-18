/**
 * Handle user authentication.
 *
 * Faculty Research Database - Final Project
 * ISTE 330 01
 * Team 11 (Fancy Four)
 * @author Nick Rung
 * @version 17 of April 2017
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');
const MySQLDatabase = require('../db/MySQLDatabase');

module.exports = function(passport) {
// used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

// used to deserialize the user
    passport.deserializeUser(function (id, done) {

        return new Promise(function (resolve, reject) {

            MySQLDatabase.getData("SELECT * FROM users WHERE id = ? ", [id]).then(function (err, resultSet) {

                if (resultSet.length === 0) {
                    reject("User not found.")
                }

                done(err, resultSet[0]);
                resolve();
            }.catch(function (error) {
                reject(error);
            }));
        });
    });


    passport.use('local-signup', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        }, function (req, username, password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            return new Promise(MySQLDatabase.getData("SELECT * FROM users WHERE username = ?", [username]).then(function (err, resultSet) {
                if (err)
                    return done(err);
                if (resultSet.length) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {
                    // if there is no user with that username
                    // create the user
                    let newUserMysql = {
                        username: username,
                        password: bcrypt.hashSync(password, "SaltySaltSaltSalt")  // use the generateHash function in our user model
                    };

                    let insertQuery = "INSERT INTO users ( username, password ) values (?,?)";

                    return new Promise(MySQLDatabase.query(insertQuery, [newUserMysql.username, newUserMysql.password]).then(function (err, resultSet) {
                        newUserMysql.id = resultSet.insertId;

                        resolve();
                        return done(null, newUserMysql);
                    }).catch(function (error) {
                        reject(error);
                    }));
                }
            }));
        })
    );
}