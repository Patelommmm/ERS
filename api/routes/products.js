const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.status(200).json({
        message: 'Handling GET'
    });
});

router.post('/', (req, res, next) => {
    res.status(200).json({
        message: 'Handling POST'
    });
});

router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;
    if (id == 'special'){
        res.status(200).json({
            message: 'you discover new ID',
            id: id
        });
    }
    else{
        res.status(200).json({
            message:'you passed ID'
        })
    }
});

router.patch('/:productId', (req, res, next) => {
    res.status(200).json({
        message: 'Updated product!',
        id: req.params.productId
    });
});

router.delete('/:productId', (req, res, next) => {
    res.status(200).json({
        message: 'Deleted product!',
        id: req.params.productId
    });
});

module.exports = router;