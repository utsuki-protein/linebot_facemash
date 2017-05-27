var channel_access_token = "LINEのchannel_access_tokenをコピペ" 
var facemash_sheet_id = "スプレッドシートのIDをコピペ"


/*
投票時のpostdataから投票された参加者の票数をインクリメント
*/
function InsertLog(name, user_id, busu){
  var sh_name = "log"
  var sheet = SpreadsheetApp.openById(facemash_sheet_id).getSheetByName(sh_name)
  var last_row = sheet.getLastRow()
  var DD = new Date()
  var Year = DD.getFullYear()
  var Month = DD.getMonth() + 1
  var Day = DD.getDate()
  var Hour = DD.getHours()
  var Minutus = DD.getMinutes()
  var Second = DD.getSeconds()
  var date = Year + "/" + Month + "/" + Day + " " + Hour + ":" + Minutus + ":" + Second
  Logger.log(sheet + "/" + last_row)
  Logger.log(name + "/" + user_id)
  Logger.log(date)
  sheet.insertRowAfter(last_row).getRange(last_row+1, 1, 1, 4).setValues([[date, name, user_id, busu]]) 
}


/*
スプレッドシートから画像のURL、名前年齢などを引っ張ってくる
*/
function GetWomanData(row){
  var colstartIndex = 3
  var colendIndex = 6
  var sh_name = "face mash"
  var sheet = SpreadsheetApp.openById(facemash_sheet_id).getSheetByName(sh_name)
  
  val = sheet.getRange(row, 2).getValue()
  val = val + 1
  sheet.getRange(row, 2).setValue(val)
  
  var data = sheet.getRange(row, colstartIndex, 1, colendIndex).getValues()
  var user_info = new Object()
  
  user_info["title"] = data[0][1]
  user_info["body"] = data[0][0] + "  " + data[0][2]
  user_info["url"] = data[0][3]
  
  return user_info
}

/*
比較対象二人の画像、名前などを取得しobjで返す。
*/
function GetFaceImage() {
  
  var user1 = Math.floor( Math.random() * 23 ) + 2
  var user2 = user1
  while(user1 == user2){
    user2 = Math.floor( Math.random() * 23 ) + 2 
  }
  var data = new Object()
  var womens = new Object()
  womens["left"] = GetWomanData(user1)
  womens["right"] = GetWomanData(user2)
  Logger.log(womens)
  return womens
}


/*
carouselの選択肢に選ばれた人は比較された数のところをインクリメント
*/
function AddVote(name){
  var sh_name = "face mash"
  var sheet = SpreadsheetApp.openById(facemash_sheet_id).getSheetByName(sh_name)
  var row = 0
  Logger.log(name)
  cells = sheet.getRange(2, 4, 24, 1).getValues()
  Logger.log(cells)
  
  for(var i = 0; i < 24 ; i ++){
    Logger.log(cells[i])
    if(cells[i] == name){
      row = i + 2
      Logger.log("row = " + row)
    }
  }
  
  val =  sheet.getRange(row, 1).getValue()
  val = val + 1
  sheet.getRange(row, 1).setValue(val)
}


/*
Linebotからのwebhookを受け取る関数
*/
function doPost(e) {
 
  var posted_json = JSON.parse(e.postData.contents);
  var events = posted_json.events;

  var entry = GetFaceImage()
  
  events.forEach(function(event) {
    if("postback" in event){
      name = event.postback.data
      var arrayOfStrings = name.split("_");
      AddVote(arrayOfStrings[0])
      user = event.source.userId
      InsertLog(arrayOfStrings[0], user, arrayOfStrings[1])
    }
    else{
      ret_msg =  {
        "type": "template",
        "template": {
          "type" : "carousel",
          "columns": [
            {
              "thumbnailImageUrl": entry["first"]["url"],
              "title": entry["left"]["title"],
              "text": entry["left"]["body"],
              "actions": [{"type": "postback",
                          "label": "この娘にする!",
                          "data": entry["left"]["title"] + "_" + entry["right"]["title"],
                          "text": "投票しました。"}]
            },
            {
              "thumbnailImageUrl": entry["right"]["url"],
              "title": entry["right"]["title"],
              "text": entry["right"]["body"],
              "actions": [{"type": "postback",
                          "label": "この娘にする!",
                          "data": entry["right"]["title"] + "_" + entry["left"]["title"],
                          "text": "投票しました"}]
            }
          ]
        },
        "altText": "代替テキスト"
      }
    }
    
    var postData = {
      "replyToken" : event.replyToken,
      "messages" : [ret_msg]
    }
    var options = {
      "method" : "post",
      "headers" : {
        "Content-Type" : "application/json",
        /*　Bearerとトークンの間はブランクいれること*/
        "Authorization" : "Bearer " + channel_access_token
      },
      "payload" : JSON.stringify(postData)
    };
    var reply = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", options);
  });

}
