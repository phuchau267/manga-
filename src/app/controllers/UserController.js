const Comic                     = require('../models/Comic');
const Chapter                   = require('../models/Chapter');
const User                      = require('../models/User')
const TimeDifferent             = require('../../config/middleware/CalcTimeVnmese')
const bcrypt                    = require('bcrypt');
const passport                  = require('passport');
const { multiMongooseToObject } = require('../../util/mongoose');
const { canChangeRole, canDeleteUser, canChangeBannedStatus }         = require('../../config/permissions/users.permission')
class UserController {

    // login Page
    loginPage(req, res, next) {
        res.render('users/login', {
            layout: 'login_register_layout',
            referer: req.headers.referer,
        })
    }

    // Login
    async login(req, res, next) {
        let username = req.body.username;
        let password = req.body.password;
        let wrongPassword = false;
        let wrongUsername = false;
        let banned = false
        if(!username) {
            username = 0
        }
        if(!password){
            password = 0
        }
        if(username && password){
            const user = await User.findOne({username: username});
            if(user){
                if(user.banned === true){
                    banned = true
                    res.render('users/login', {
                        layout: 'login_register_layout',
                        banned
                    });
                }else{
                    const validPassword = await bcrypt.compare(password, user.password)
                    if(validPassword){
                        passport.authenticate('local', function(err, user, info) {
                            if (err) { return next(err); }
                            if (!user) { return res.redirect('/users/login'); }
                            req.logIn(user, function(err) {
                                if (err) { 
                                    return next(err); 
                                }else{
                                    return res.redirect('/')
                                }
                            });
                        })(req, res, next);
                    }else{
                        wrongPassword = true
                    }
                }
                
            }else{
                wrongUsername = true
            }
        }
        if(username == 0 || password == 0 || wrongPassword == true || wrongUsername == true){
            res.render('users/login', {
                layout: 'login_register_layout',
                username,
                password,
                wrongPassword,
                wrongUsername,

            });
        }
    };
    testUser(req,res){
        res.redirect('/');
        console.log('user moi dang nhap ne' + req.user)
    }
    // Logout
    logout(req, res) {
        req.logout();
        req.flash('success-message', 'You are logged out');
        res.redirect('/');
    };

    // Register Page
    registerPage(req, res, next) {
        let registerSubmit = true;
        res.render('users/login', {
            registerSubmit,
            layout: 'login_register_layout'
        })
    }
    
    // Register
    async register(req, res, next) {
        let registerUsername = req.body.registerUsername;
        let registerPassword = req.body.registerPassword;
        let confirmPassword = req.body.confirmPassword;
        
        
        
        let acceptRegisterUsername = 0;
        let acceptRegisterPassword = 0;
        let acceptConfirmPassword = 0;
        let banned = false;
        let registerSubmit = true;
        if(!registerUsername){
            registerUsername = 0;
        }else if(registerUsername.length >6){
            const nameExist = await User.findOne({username: registerUsername});
            if(nameExist){
                acceptRegisterUsername = 1;
                if(nameExist.banned === true){
                    banned = true;
                    
                    res.render('users/login',{
                        layout: 'login_register_layout',
                        banned,
                        registerSubmit
                    })
                }else{
                    
                    res.render('users/login',{
                        layout: 'login_register_layout',
                        acceptRegisterUsername,
                        registerSubmit
                    })
                }
            }else{
                acceptRegisterUsername = 3;
            }
        }else{
            acceptRegisterUsername = 2;
        }
        if(!registerPassword){
            registerPassword = 0;
        }else if(registerPassword.length >6){
            acceptRegisterPassword = 3;
        }else{
            acceptRegisterPassword = 2;
        }
        if(!confirmPassword){
            confirmPassword = 0;
        }else if(registerPassword === confirmPassword){
            acceptConfirmPassword = 3;
        }else{
            acceptConfirmPassword = 1;
        }
        if(registerUsername == 0 || acceptRegisterUsername == 1 || acceptRegisterUsername == 2 || registerPassword == 0 || acceptRegisterPassword == 2 || confirmPassword == 0 || acceptConfirmPassword == 1){
     
            res.render('users/login',{
                layout: 'login_register_layout',
                registerSubmit,
                registerUsername,
                registerPassword,
                confirmPassword,
                acceptRegisterUsername,
                acceptRegisterPassword,
                acceptConfirmPassword,
                
            })
        }else{
      
        
            req.body.avatar = 'chuacohinh'
            const {registerUsername,registerPassword: plainTextPassword} = req.body;
            const registerPassword = await bcrypt.hash(plainTextPassword, 10);

            const user = new User({
                displayname:registerUsername,
                username:registerUsername,
                password:registerPassword,
                
                avatar:req.body.avatar
            })
                try {
                    user.save();
                    res.redirect('/users/login')
                } catch (err) {
                        res.status(400).send(err)
                }
        }


    }

    // Upgrade Role to extraAdmin
    async changeRole(req, res, next) {
        try {
            var roleWantToChange = req.params.role // upToExtraAdmin || downToUser
            var myRole = req.user.role
            var user = await User.findOne({ _id: req.params.userId })

            authChangeRole(user, req, res, next)
        
            async function authChangeRole(user, req, res, next) {
                var check = await canChangeRole(user, myRole)
                if (!check) {
                    res.status(401).redirect(`/me/stored/comics/dashboard/${myRole}`)
                    req.flash('error-message', 'Bạn không đủ điều kiện để thay đổi Role của người này')
                } else {
                    changeRoleAccordingly(user, req, res, next)
                }
            }

            async function changeRoleAccordingly(user, req, res, next) {
                user.role = roleWantToChange
                user
                .save()
                .then(() => {
                    req.flash('success-message', `Thay đổi Role của ${user.name} sang ${roleWantToChange} thành công`)
                    res.redirect(`/me/stored/comics/dashboard/${myRole}`)
                })
                .catch(next)
            }

        } catch (err) {
            next(err)
        }
    }

    // Delete User
    async deleteUser(req, res, next) {
        try {
            var myRole = req.user.role
            var userToDelete = await User.findOne({ _id: req.params.userId })

            authDeletePermission(userToDelete, req, res, next)
        
            async function authDeletePermission(userToDelete, req, res, next) {
                var check = await canDeleteUser(userToDelete, myRole)
                if (!check) {
                    res.status(401).redirect(`/me/stored/comics/dashboard/${myRole}`)
                    req.flash('error-message', 'Bạn không đủ điều kiện để Xóa người này')
                } else {
                    deleteUser(userToDelete, req, res, next)
                }
            }
            async function deleteUser(userToDelete, req, res, next) {
                userToDelete
                .remove()
                .then(() => {
                    req.flash('success-message', `Xóa User thành công`)
                    res.redirect(`/me/stored/comics/dashboard/${myRole}`)
                })
                .catch(next)
            }
        } catch(err) {
            next(err)
        }
    }

    // Ban User
    async changeBannedStatus(req, res, next) {
        try {
            var statusWantToChange = req.params.banType // true || false
            var message = (statusWantToChange === 'true') ? 'Ban' : 'unBan'
            var myRole = req.user.role
            var userToBan = await User.findOne({ _id: req.params.userId })

            authBanPermission(userToBan, req, res, next)
        
            async function authBanPermission(userToBan, req, res, next) {
                var check = await canChangeBannedStatus(userToBan, myRole)
                if (!check) {
                    res.status(401).redirect(`/me/stored/comics/dashboard/${myRole}`)
                    req.flash('error-message', `Bạn không đủ điều kiện để ${message} người này`)
                } else {
                    changeUserStatus(userToBan, req, res, next)
                }
            }
            async function changeUserStatus(userToBan, req, res, next) {
                userToBan
                .updateOne({banned: statusWantToChange})
                .then(() => {
                    req.flash('success-message', `${message} User thành công`)
                    res.redirect(`/me/stored/comics/dashboard/${myRole}`)
                })
                .catch(next)
            }
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new UserController();
