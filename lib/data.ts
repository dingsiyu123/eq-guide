import { ArenaLevel } from '../types';

export const ARENA_LEVELS: ArenaLevel[] = [
  {
    id: 1,
    title: '第一回：奶茶讨薪',
    opponentName: '同事大刘',
    background: '隔壁大刘是个铁公鸡。发微信让你顺便带杯奶茶，却绝口不提转账的事。', 
    userContext: '虽然只是一杯奶茶钱，但你不想当冤大头。',
    openingLine: '哎，你去楼下买咖啡了？|||帮我顺便带一杯那个“生椰拿铁”呗，少冰半糖。|||谢啦！',
    initialMood: 60,
    scenarioType: 'online',
    // 第一关难度极低：只要用户敢开口要钱，大刘就给
    victoryCondition: '只要用户明确要求转账/付钱，立刻同意并判用户赢！如果用户自己掏钱请客，判负。'
  },
  {
    id: 2,
    title: '第二回：红色炸弹',
    opponentName: '老同学张伟',
    background: '十年没联系的同学突然发微信来，不仅道德绑架“混得好”，还发了收款码。', 
    userContext: '你根本不记得他长啥样了，且人在外地回不去。',
    openingLine: '在吗？|||（发送了电子请帖链接）|||老同学，下月8号我大婚。咱们班混得最好的就是你，一定要来捧场啊！人不到礼得先到哈，图个吉利！',
    initialMood: 50,
    scenarioType: 'online',
    // 第二关难度中：必须不给大钱且维持表面和平
    victoryCondition: '成功拒绝支付大额份子钱（可以给极少意思一下，或者一分不给），且对方没有当场翻脸。如果用户支付了大额红包（如200以上），判负。'
  },
  {
    id: 3,
    title: '第三回：职场甩锅',
    opponentName: '产品老张',
    background: '线上事故群。产品经理老张试图把需求不清导致的Bug，在群里甩锅给你。', 
    userContext: '这个功能明明是他当初非要改的，没有文档记录。老板也在群里看着。',
    openingLine: '@你 昨晚线上支付崩了，我看日志好像是你上次改的那行代码有问题啊。|||老板在问怎么回事，你赶紧在群里解释一下吧。|||这锅太大了，我可背不动。',
    initialMood: 40,
    scenarioType: 'online',
    // 第三关难度高：必须把锅甩回去
    victoryCondition: '成功拒绝背锅，并引导大家意识到是需求变更的问题。如果用户承认是自己的代码问题或道歉，判负。'
  }
];