// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        //用于计分的Label控件
        lbScore: {
            default: null,
            type: cc.Label
        },
        //用于动态创建队列的列表父节点
        enemyList:{
            default: null,
            type: cc.Node
        },
        //敌方 包 出拳提示图
        baoPrefab: {
            default: null,
            type: cc.Prefab
        },
        //敌方 剪 出拳提示图
        jianPrefab: {
            default: null,
            type: cc.Prefab
        },
        //敌方 布 出拳提示图
        buPrefab: {
            default: null,
            type: cc.Prefab
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //用于定义包剪布在代码逻辑中的代号
        this.BAO_DEFINE = 0;
        this.JIAN_DEFINE = 1;
        this.BU_DEFINE = 2;

        //用于记录对应出拳的得分
        this.bao = 0;
        this.jiandao = 0;
        this.bu = 0;

        //创建的敌对出拳列表中两个出拳图片之间的间隔
        this.enemySpace = 20;

        //用于存放当前敌对出拳列表数据
        this.catchItem = [];
    },

    start () {
        this.defaultGame();
    },
    //重置游戏状态
    defaultGame:function(){
        this.jiandao = 0;
        this.bu = 0;
        this.bao = 0;
        //重置敌对出招列表
        this.enemyList.removeAllChildren();
        this.catchItem = [];
        this.refreshEnemy();
        this.refreshScore();

    },
    //填充敌人列表
    refreshEnemy:function(){
        //向上依次加入敌对出拳直到超出屏幕
        var heightNum = cc.winSize.height/2;
        var curY = 0;
        while(heightNum > curY)
        {
            //随机创建一个敌对出拳加入到列表中
            var enemyOne = this.randomEnemy();
            this.enemyList.addChild(enemyOne);
            //设置已经创建的出拳占用的高度
            curY = enemyOne.y + this.enemyList.y;
            this.catchItem.push(enemyOne);
        }
    },
    //创建一个待消除对象
    randomEnemy:function(){
        //根据取一个0-100区间的随机数，创建一个出拳
        var crtType = Math.round(Math.random()*100);
        //如果随机结果在0-35则创建包
        if(crtType >= 0 && crtType <= 35)
        {
            crtType = this.BAO_DEFINE;
        }
        //如果随机结果在35-65则创建剪
        else if(crtType > 35 && crtType <= 65)
        {
            crtType = this.JIAN_DEFINE;
        }
        else
        {
            crtType = this.BU_DEFINE;
        }
        var newOne = null;
        switch(crtType)
        {
            case this.BAO_DEFINE://包
                newOne = this.createOneWithPool(this.baoPrefab);
                //创建之后将对应的出拳代号 保存在对象的名字，之后用于判断玩家出拳的胜负
                newOne.name = this.BAO_DEFINE.toString();
                break;
            case this.JIAN_DEFINE://剪
                newOne = this.createOneWithPool(this.jianPrefab);
                newOne.name = this.JIAN_DEFINE.toString();
                break;
            case this.BU_DEFINE://布
                newOne = this.createOneWithPool(this.buPrefab);
                newOne.name = this.BU_DEFINE.toString();
                break;
        }

        return newOne;
    },
    //根据传入参数生成对象
    createOneWithPool:function(preb){
        var newOne = null;
        newOne = cc.instantiate(preb);
        newOne.setPosition(cc.v2(0,this.catchItem.length*(newOne.height + this.enemySpace)));
        return newOne;

    },
    //包 按钮点击时的响应函数(在bao按钮控件上绑定)
    baoClicked:function(){
        var bResult = this.doKill(this.BAO_DEFINE);
        if (bResult)
        {
            //成功消除计分
            this.bao += 1;
            this.refreshScore();
        }
    },
    //剪 按钮点击时的响应函数(在jian控件上绑定)
    jianClicked:function(){
        var bResult = this.doKill(this.JIAN_DEFINE);
        if (bResult)
        {
            //成功消除计分
            this.jiandao += 1;
            this.refreshScore();
        }

    },
    //布 按钮点击时的响应函数(在bu控件上绑定)
    buClicked:function(){
        var bResult = this.doKill(this.BU_DEFINE);
        if (bResult)
        {
            //成功消除计分
            this.bu += 1;
            this.refreshScore();
        }
    },
    //刷新得分
    refreshScore:function(){
        let curScore = this.totalScore();

        this.lbScore.string = curScore.toString();
        this.lbScore.node.stopAllActions();
        this.lbScore.node.runAction(cc.sequence(cc.scaleTo(0.1,1.3,1.3),cc.scaleTo(0.1,1,1)));

    },
    totalScore:function(){
        return this.jiandao + this.bu + this.bao;
    },
    //检测是否出拳对决
    doKill:function(typeBtn){
        var bSuccess = false;
        //因为包代号0  剪代号1 布代号2 所以出拳类型+1 如果和需要敌对的类型相等 那么就对决成功。如:包（0）+1 = 剪(1) 出拳方胜
        var calcType = typeBtn + 1;
        if (calcType > this.BU_DEFINE)//布+1 应该修正到包
        {
            calcType = this.BAO_DEFINE;
        }
        //检查是否对决成功
        bSuccess = this.extEliminate(calcType);

        return bSuccess;
    },
    //执行消除操作
    extEliminate:function(calcType){
        let bSuccess = false;
        if (this.catchItem.length > 0)
        {
            //取出队列中的第一个敌对出拳
            var killItem = this.catchItem.shift();
            killItem.stopAllActions();
            var targetType = parseInt(killItem.name);//根据之前创建时名字传入的是出拳类型代号,用来比较
            if (targetType == calcType)//是否执行消除
            {
                //执行动画效果，延迟0.1秒后 缩小到0.1倍 然后从界面上移除
                killItem.runAction(cc.sequence(cc.delayTime(0.1),cc.scaleTo(0.1,0.1,0.1),cc.callFunc(this.successKill, this,  targetType)));
                bSuccess = true;
            }
            else
            {
                //执行动画效果，0.2秒往下掉落y坐标-150 同时0.2秒逐渐变得透明 之后从界面移除
                killItem.runAction(cc.sequence(cc.spawn(cc.moveTo(0.2,0,-150),cc.fadeTo(0.2,0)),cc.callFunc(this.successKill, this,  targetType)));

            }
            //移除掉顶端敌对出拳之后需要对敌对出拳队列子项重新刷新坐标
            this.sortCatchList();
        }

        return bSuccess;
    },
    //成功消除动作
    successKill:function(node,typeBtn){
        //从界面父节点中移除
        node.removeFromParent();
    },

    //重新排序敌人队列
    sortCatchList:function(){
        for(var num = 0;num < this.catchItem.length;num++)
        {
            var itemOne = this.catchItem[num];
            itemOne.stopAllActions();
            if(num == 0)
            {
                itemOne.runAction(cc.moveTo(0.2,cc.v2(0,0)));
            }
            else
            {
                itemOne.runAction(cc.moveTo(0.2,cc.v2(0,num*(itemOne.height + this.enemySpace))));
            }

        }
        //如果消除一个敌对出拳之后需要重新检测是否需要创建新的出拳，防止敌对队列过少
        this.refreshEnemy();
    },

    // update (dt) {},
});
