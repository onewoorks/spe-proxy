import express from 'express';

const router = express.Router();

router.post('/read', (req, res) => {
    res.send({
        name:"Irwan B Ibrahim",
        ic_no: "821021065515",
        address: "39D Jalan Kenanga Sura Jati",
        postcode: "23000",
        state: "Terengganu",
        city: "dungun"
    })
});

export default router;