  var TALK_BUTTON_CATALOG = [
    { id:"owner", label:"주인", icon:"🧑", base:true },
    { id:"food", label:"밥", icon:"🍖", base:true },
    { id:"walk", label:"산책", icon:"🐾", base:true },
    { id:"like", label:"좋아", icon:"💗", base:true },
    { id:"dislike", label:"싫어", icon:"👎", base:true },
    { id:"bad", label:"나빠", icon:"😠", base:false },
    { id:"doit", label:"해줘", icon:"🙏", base:false },
    { id:"dontwant", label:"하기싫어", icon:"🙅", base:false },
    { id:"silly", label:"바보", icon:"😝", base:false },
    { id:"pooped", label:"똥쌌어", icon:"💩", base:false },
    { id:"pretty", label:"예뻐", icon:"✨", base:false },
    { id:"best", label:"최고", icon:"🏆", base:false }
  ];
  var TALK_BUTTON_BASE_IDS = TALK_BUTTON_CATALOG.filter(function(d){ return d.base; }).map(function(d){ return d.id; });
  function findTalkButtonDef(id){ return findById(TALK_BUTTON_CATALOG, id); }

