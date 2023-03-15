const userSchema = mongoose.Schema({
    name:{
        type:String,
        maxlength:50
    },
    email:{
        type:String,
        trim:true,
        unique:1
    },
    password:{
        type:String,
        minlength:5
    },
    lastname:{
        type:String,
        maxlength:50
    },
    role:{
        type:Number,
        default: 0 // 1이면 관리자, 0 이면 사용자
    },
    image:String,
    token:{
        type:String
    },
    tokenExp:{
        type:Number
    }, // 유효기간 설정
})
const User = mongoose.model('User',userSchema)
module.exports = {User};
module.exprots = {Prdocut}