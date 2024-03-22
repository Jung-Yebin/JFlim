const express = require('express');
const router = express.Router();
const db = require('../model/db');
// const session = require('express-session');
//express-session 미들웨어 설정
// router.use(session({
//     secret : "jungyebin",
//     cookie : { 
//         maxAge:60000,
//         sameSite: 'strict',
//     },
//     resave: true,
//     saveUninitialized: true,
// }));


// router.use((req, res, next) => {
//     res.locals.user_id = "";
//     next()
// })

router.get("/", function(req, res){

    const { spawnSync } = require('child_process');

    const python = spawnSync('python', ['./router/top_ranking_movie.py']);

    const stdout = python.stdout.toString();

    // console.log(`main_stdout : ${data}`);

    const keywords_list = ["top_ranking_movie", "top_count_movie"];
    const str_values = stdout.toString();
    const values = str_values.replace(/\s+/g, '');
    let values_list = [];

    console.log("values값", values);

    for (let i = 0; i < keywords_list.length; i++) {
        let startIndex = 0;
        while (startIndex !== -1) {
            //0번째 인덱스부터 keywords_list[i]의 인덱스를 찾는다
            startIndex = values.indexOf(keywords_list[i], startIndex);
            if (startIndex !== -1) {
                const endIndex = values.indexOf("]", startIndex);
                if (endIndex !== -1) {
                    values_list.push(values.substring(startIndex + keywords_list[i].length + 1, endIndex));
                    startIndex = endIndex + 1;
                } else {
                    break;
                }
            }
        }
    }

    const str1 = values_list[0]
    const str2 = values_list[1]

    console.log('1', str1, '2', str2);

    const str_top_ranking_movie = values_list[0];
    const top_ranking_movie = str_top_ranking_movie.split(',');

    const str_top_count_movies = values_list[1];
    const top_count_movies = str_top_count_movies.split(',');

    console.log("탑랭킹무비", top_ranking_movie);
    res.locals.user_id = ""
    const user = req.session.user;

    if(user){
        res.locals.user_id = user.user_id;
        const dict_usermovie = {}
        const top_ranking_movie_dict = {}
        const top_count_movie_dict = {}

        Promise.all([
            db.rating.findAll({
                where : {
                    user_id : res.locals.user_id
                }
            }),
            db.rating.findAll()
        ])
        .then(async function ([userRatings, movieRatings]){
            userRatings.forEach(item => {
                let genre_list2 = []
                item.genre.split(',').forEach(function(item){
                    genre_list2.push(parseInt(item))
                })

                dict_usermovie[item.movieID] = {"posterImg" : item.posterImg, "title" : item.title, "genre" : genre_list2, "date" : item.date}
            })
            for (let test = 0; test < top_ranking_movie.length; test++){
                const movieID = top_ranking_movie[test];
                
                movieRatings.forEach(item => {
                    if(item.movieID === parseInt(movieID)){
                        let genre_list = item.genre.split(',');
                        top_ranking_movie_dict[test] = {'movieID' : item.movieID, 'title' : item.title, 'genre' : genre_list, 'posterImg' : item.posterImg, 'date' : item.date};
                    }
                })
            }

            for(let count = 0; count < top_count_movies.length; count++){
                const movieID = top_count_movies[count];

                movieRatings.forEach(item => {
                    if (item.movieID === parseInt(movieID)){
                        let genre_list = item.genre.split(',');
                        top_count_movie_dict[count] = {'movieID' : item.movieID, 'title' : item.title, 'genre' : genre_list, 'posterImg' : item.posterImg, 'date' : item.date};
                    }
                })
            }
            res.render('main', {title : "JFILM", user:req.session.user, user_id:res.locals.user_id, dict_usermovie : dict_usermovie, top_ranking_movie_dict : top_ranking_movie_dict, top_count_movie_dict : top_count_movie_dict})
        })
    }
    else{
        const dict_movieinfo = {}
        const top_ranking_movie_dict = {}
        const top_count_movie_dict = {}

        db.rating.findAll().then(function(result){
            result.forEach(function(item){
                let genre_list = []
                item.genre.split(',').forEach(function(item){
                    genre_list.push(parseInt(item))
                })
                dict_movieinfo[item.user_id + item.movieID] = {'moiveID' : item.movieID, 'userID' : item.user_id, "posterImg" : item.posterImg, "title" : item.title, "genre" : genre_list, "ranking" : item.rating, "date" : item.date}
                // console.log("로그인X, moiveinfo", dict_movieinfo)
            })
            for(let test = 0; test < top_ranking_movie.length; test ++ ){
                const movieID = top_ranking_movie[test];

                result.forEach(function(item){
                    if(item.movieID === parseInt(movieID)){
                        let genre_list = item.genre.split(',');
                        top_ranking_movie_dict[test] = {'movieID' : item.movieID, 'title' : item.title, 'genre' : genre_list, 'posterImg' : item.posterImg, 'date' : item.date};
                    }
                });
            }
            for(let count = 0; count < top_count_movies.length; count++){
                const movieID = top_count_movies[count];

                result.forEach(item => {
                    if (item.movieID === parseInt(movieID)){
                        let genre_list = item.genre.split(',');
                        top_count_movie_dict[count] = {'movieID' : item.movieID, 'title' : item.title, 'genre' : genre_list, 'posterImg' : item.posterImg, 'date' : item.date};
                    }
                })
            }
            res.render('main', { title: "JFILM", user:req.session.user, user_id:res.locals.user_id, top_ranking_movie_dict : top_ranking_movie_dict, top_count_movie_dict : top_count_movie_dict});
        })
        // res.render('main', { title: "JFILM", user:req.session.user, user_id:res.locals.user_id, top_ranking_movie_dict : top_ranking_movie_dict});
    }
    console.log("안녕하십니까?", res.locals.user_id);
    console.log("홈화면 !!! ", req.session.user);
});

router.get("/login", function(req, res){
    res.render('login', { title: "JFILM" , session: req.session});
});

router.post("/login", async function(req, res){

    const user_id = req.body.email;
    const user_pwd = req.body.password;


    console.log("유저 아이디 :", user_id);
    console.log("유저 비밀번호 : ", user_pwd);

    //데이터베이스에서 유저 정보 확인

    try {
        const user = await db.users.findOne({
            where:{
                user_id : user_id,
                user_pwd : user_pwd
            }
        });

        if (user){
            req.session.user={
                user_id : user.user_id,
            };

            console.log("로그인한 회언", req.session.user);
            return res.redirect('/');
            //res.write("<script>alert('login success!');location.href='/';</script>");
        } else{
            req.session.loginFailed = true;
            return res.redirect('/login');
        }
    } catch(error){
        console.log(error);
        res.status(500).send('Server Error!');
    }
});

router.get("/logout", function(req,res){
    console.log("로그아웃", req.session);
    req.session.destroy(function(err){
        if (err){
            console.log('오류발생')
        }
        else { 
            return res.redirect('/');
        }
    });
});

router.get("/signin",function(req,res){
    res.render('signin', { title: "JFILM"})
});

// 테스트용 Table Create
router.post("/signin", function(req, res) { // Changed to POST

    const user_id = req.body.email;
    const user_pwd = req.body.password;

    console.log("유저 아이디!!:", user_id);
    console.log("유저 비밀번호!!:", user_pwd);

    // findOrCreate 메서드로 기존 레코드를 찾음 or 없으면 생성
    db.users.findOrCreate({
        where: { user_id: user_id },
        defaults: {
            user_pwd: user_pwd
        }
    }).then(function([user, created]) {
        if (created){
            console.log("생성됨");
            res.write("<script>alert('Success'); location.href='/';</script>")
            //res.send({success:200, message:"회원가입이 완료되었습니다"});
            //res.status(200).json({success:true, message: "회원가입이 완료 되습니다"});
            //res.send({ success: 200 });
            return res.redirect('/login');
        } else {
            console.log("User already exists with the same user_id");
            res.write("<script>alert('Duplicated email.'); location.href='/signin';</script>")
            //res.send({success:400, message:"이미 존재하는 회원입니다."});
            //res.status(400).json({success:false, message:"이미 존재하는 회원입니다."});
            //res.status(409).send({ error: "User with the same user_id already exists" });
            //res.send({ success : 400});
            return res.redirect('/signin');
        }
    }).catch(function(err){
        console.error(err);
        //res.status(500).send({ error: "Internal Server Error" });
    });
});

const fs = require('fs');
// 영화 자세히 보기
router.get("/detailedmovie", function(req, res){
    res.locals.user_id = ""
    const user = req.session.user;

    const { exec } = require('child_process');
    const {spawn} = require ('child_process');
    const python = spawn('python', ['./router/movie_cart_dataset.py']);

    // python.stdout.on('close', () => {
    //     exec('python ./router/collaborative_filtering.py', (error, stdout, stderr) => {
    //         if (error) {
    //             console.error(`exec error: ${error}`);
    //             return;
    //         }
    //         console.log('예상평점 업데이트완료');
    //     });
    // });
    let predictionResult;

    python .stdout .on ('data', (data )=>{
        console .log (`stdout : ${data }`);

        fs.readFile('./prediction_result.json', 'utf-8', (error, fileData) => {
            if (error) {
                console.error('에러발생', error);
                res.status(500).send('서버 오류');
            }
            predictionResult = fileData;
            console.log("gma?", predictionResult.toString());
        })
        try {
            // 파일에서 결과를 읽어오기
            // ※ 파이썬 패키지 설치 이슈로 인하여 해당 파이썬 프로세스를 직접 실행해야함 ※
            predictionResult = fs.readFileSync('./prediction_result.json', 'utf-8');
        } catch (error) {
            console.error("Error reading prediction result file:", error);
            res.status(500).send("Internal Server Error");
        }
        const cartdataset = data.toString();
        // const predictionset = predictionResult.toString();
       
        const predictionset = JSON.parse(predictionResult.toString());

        Promise.all([
            db.comments.findAll(),
            db.rating.findAll(),
            db.related.findAll(),
        ]).then(async function([comments, ratings, related]){
            if(user){
                res.locals.user_id = user.user_id;
                const comments_result_dict = {};
                const filterMovieID = {};
                const allusers_ranking = [];
                comments.forEach(item =>{
                    comments_result_dict[item.idx] = {};
                    comments_result_dict[item.idx][item.movieID] = item.comments;
                });
        
                ratings.forEach(item => {
                    if(item.user_id == res.locals.user_id){
                        filterMovieID[item.movieID] = item.rating;
                    }
                    allusers_ranking.push({"userID" : item.user_id, "movieID" : item.movieID, "rating" : item.rating});
                });

                //해당 영화와 연관있는 영화 리스트 추출
                const related_movie_list = await processRelatedItems(related);

                // 해당 유저의 예상 별점
                const prediction_list = predictionset[res.locals.user_id];

                let prediction_dict = {}

                if (prediction_list){
                    for (let prediction_list_count = 0; prediction_list_count < prediction_list.length; prediction_list_count++){
                        const movieID = prediction_list[prediction_list_count].movieID;
                        const real = prediction_list[prediction_list_count].real;
                        const predictive = prediction_list[prediction_list_count].predictive;
                        
                        prediction_dict[movieID] = {'real' : real, 'predictive' : predictive} 
                    }
                }
                res.render('detailedmovie', { movieinfo : filterMovieID, allusersRanking : allusers_ranking, user_id:res.locals.user_id, title:"JFILM", cartdataset : cartdataset, comments_result_dict : comments_result_dict, related_movie_list : related_movie_list, prediction_dict : prediction_dict});
            }
            else {
                const comments_result_dict = {};
                const allusers_ranking = [];
                comments.forEach(item => {
                    comments_result_dict[item.idx] = {};
                    comments_result_dict[item.idx][item.movieID] = item.comments;
                });
    
                ratings.forEach( item => {
                    allusers_ranking.push({"userID" : item.user_id, "movieID" : item.movieID, "rating" : item.rating});
                });

                const related_movie_list = await processRelatedItems(related);

                res.render('detailedmovie', {title: "JFILM", user_id:res.locals.user_id, allusersRanking : allusers_ranking, cartdataset : cartdataset, comments_result_dict: comments_result_dict, related_movie_list : related_movie_list});
            }
        })
    })

    async function processRelatedItems(related) {
        const related_movie_list = {};
        const rml2 = {};
    
        for (const item of related) {
            console.log(item);
            const list = item.dataValues.releatedmovieID.split(',').map(Number);
    
            for (let i = 0; i < list.length; i++) {
                if (!related_movie_list[item.movieID]) {
                    related_movie_list[item.movieID] = {};
                    rml2[item.movieID] = {};
                }
                const getPosterImg = await db.rating.findOne({
                    where: {
                        movieID: list[i]
                    }
                });
                related_movie_list[item.movieID][list[i]] = getPosterImg.posterImg;
                rml2[item.movieID][list[i]] = {'posterImg' : getPosterImg.posterImg, 'title' : getPosterImg.title, 'genre' : getPosterImg.genre, 'date' : getPosterImg.date};
            }
        }
        console.log("원래 딕셔너리", related_movie_list);
        console.log("수정 후 딕셔너리", rml2)
        return rml2;
    }

    console.log("영화디테일화면",res.locals.user_id);
})

router.post('/detailedmovie', async function(req, res){
    const rating = req.body.rating;
    const movieID = req.body.movieID;
    const user = req.session.user;
    const posterImg = req.body.posterImg;
    const date = req.body.date;
    const genre = req.body.genre;
    const title = req.body.title;

    console.log('현재 로그인중인 ', user);
    console.log('받아온 rating값 : ', rating);
    console.log('받아온 movieID값 : ', movieID);
    console.log('받아온 postImg값 : ', posterImg);
    console.log('받아온 date값 : ', date);
    console.log('받아온 genre값 : ', genre);
    console.log('받아온 title값 : ', title);

    const totalcomments = req.body.comments_dict;
    console.log('받아온 comments들 : ', totalcomments);

    const recommend_movie_list = req.body.recommend_movie_list;
    console.log("받아온 추천 영화 값 : ", recommend_movie_list);
    let recommend_movie = ''
    if (recommend_movie_list){
        recommend_movie = recommend_movie_list.join(',');
    }

    const related_movie_posterImg = {};

    if(user && rating){
        const user_id = user.user_id;
        try{
            const foundRating = await db.rating.findOne({
                where : {
                    user_id : user_id,
                    movieID : movieID
                }
            });

            if (foundRating){
                //레코드가 이미 존재함 -> 업데이트
                foundRating.rating = rating;
                await foundRating.save();
                console.log("레코드 업데이트");
            } else {
                await db.rating.create({
                    user_id : user_id,
                    rating : rating,
                    movieID : movieID,
                    posterImg : posterImg,
                    date : date,
                    title : title,
                    genre : genre,
                });
                console.log("새로운 레코드 생성")
            }
        }catch (error){
            console.error("데이터베이스 작업 실패 : ", error);
        }
    }else{
        console.error("로그인된 사용자가 없습니다");
    }
    if (user && totalcomments){
        let dict_count = Object.keys(totalcomments).length;
        try{
            for (let comment = 0; comment < dict_count; comment++){
                db.comments.create({
                    where : {
                        movieID : movieID
                    },
                    movieID : movieID,
                    comments : totalcomments[comment.toString()],
                })
            }
            console.log("comments레코드 생성");
        }
        catch(error){
            console.error("오류발생");
        }
    }
    if (recommend_movie){
        try {
            const createdMovie = await db.related.findOne({
                where : {
                    movieID: movieID
                },
                releatedmovieID: recommend_movie
            });
            if (createdMovie){
                createdMovie.releatedmovieID = recommend_movie;
                await createdMovie.save();
                console.log("업데이트");
            } else {
                await db.related.create({
                    movieID : movieID,
                    releatedmovieID : recommend_movie
                });
                console.log("새로운 레코드 생성");
            }
        } catch(error) {
            console.error("오류 발생:", error);
        }
    }
    if (recommend_movie_list){
        try {
            for (let movieID = 0; movieID < recommend_movie_list.length ; movieID ++ ){
                const getPosterImg = await db.rating.findOne({
                    where : {
                        movieID : recommend_movie_list[movieID]
                    }
                })
                console.log(getPosterImg.posterImg);
                related_movie_posterImg[recommend_movie_list[movieID]] = getPosterImg.posterImg;
                // 데이터를 세션에 저장하기
                req.session.related_movie_posterImg = related_movie_posterImg
                console.log("받아온값", related_movie_posterImg);
            }
        } catch(error) {
            console.log(error);
        }
    }
});

router.get('/allratedmovie', function(req, res){
    res.locals.user_id = ""
    const user = req.session.user;
    const movie_dict = {};
    let genre_list = [];

    if(user){
        res.locals.user_id = user.user_id;
        db.rating.findAll({
            where : {
                user_id : res.locals.user_id
            }
        }).then(function(result){
            result.forEach(function(item){
                genre_list = (item.genre).split(',')
                movie_dict[item.movieID] = {'title' : item.title, 'genre' : genre_list, 'posterImg': item.posterImg, 'date': item.date, 'rating':item.rating}
            })
            res.render('allratedmovie', {title : 'JFILM', movie_dict : movie_dict})
        })
        
    }
    
})

router.get('/userinfo', function(req, res){
    res.locals.user = ""
    const user = req.session.user;

    if(user){
        res.locals.user_id = user.user_id;
        console.log("사용자의 개인 페이지", res.locals.user_id);
        const baseUrl = "http://localhost:3000";
        const path = `/userinfo/${res.locals.user_id}`;
        const url = new URL(path, baseUrl);
        res.redirect(url.toString());
    }
});

//'/userinfo/'다음에 사용자의 ID를 동적으로 받아들일 수 있다
// ':user_id'는 url의 일부를 나타냄 
router.get('/userinfo/:user_id', function(req, res){
    const userId = req.params.user_id;
    console.log("userinfo 유저아이디", userId);
    const userinfo_dict = {};

    db.rating.findAll({
        where : {
            user_id : userId
        }
    }).then(function(result){
        result.forEach(function(item){
            let genre_list = []
            item.genre.split(',').forEach(function(item){
                genre_list.push(parseInt(item))
            })
            userinfo_dict[item.title] = {"genreId" : genre_list, "rating" : item.rating}
        })
        userinfo_dict_length = Object.keys(userinfo_dict).length;
        console.log(userinfo_dict);
        console.log(Object.keys(userinfo_dict).length);
        res.render('userinfo', {title:'JFILM', user_id:userId, userinfo_dict:userinfo_dict, len_userinfo_dict:userinfo_dict_length})
    })
})

module.exports = router;
