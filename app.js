
// Required modules
require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require('mongoose')
const _ = require('lodash')

// app setup
const app = express()
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))


// MongoDB Setup & Schemas

mongoose.connect('mongodb+srv://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@cluster0.rwjur.mongodb.net/todoDB?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
.catch(error => {console.log(error)})

const Schema = mongoose.Schema
const itemsSchema = new Schema({
  name: String
})
const Item = mongoose.model('Item', itemsSchema)
const item1 = new Item({
  name: 'Welcome to your todo list.'
})
const item2 = new Item({
  name: 'Hit the + button to add a new item.'
})
const item3 = new Item({
  name: '<-- Click the checkbox to delete the item.'
})
const defaultItems = [item1, item2, item3]
const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema)



// Default list route
app.get("/", function(req, res){
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err, result){
        if (err){
          console.log(err)
        }
      })
      res.redirect('/');
    }
    else{
      res.render('list', {listTitle: "Today", newItems: foundItems})
    }
  })
})

// Custom list routes
app.get("/:CustomListName", function(req, res){
  const customListName = _.capitalize(req.params.CustomListName)
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect("/" + customListName)
      }
      else{
        // show existing list
        res.render("list", {listTitle: foundList.name, newItems: foundList.items})
      }
    }
    else{
      console.log(err)
    }
  })
})


// Add to list
app.post("/", function(req, res){
  const newItem = req.body.newItem
  const listTitle = req.body.list
  const item = new Item({
    name: newItem
  })

  if (listTitle === "Today"){
    item.save()
    res.redirect('/')
  }
  else{
    List.findOne({name: listTitle}, function(err, foundList){
      if (!err){
        foundList.items.push(item)
        foundList.save()
        res.redirect("/" + listTitle)
      }
      else{
        console.log(err)
      }
    })
  }
})


// Delete from list
app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox
  const listTitle = req.body.listTitle
 
  if (listTitle === 'Today'){
    Item.findByIdAndRemove(checkedItemID, function(err, result){
      if (!err){
        res.redirect('/')
      }
      else{
        console.log(err)
      }
    })
  }
  else{
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if (!err){
        res.redirect('/' + listTitle)
      }
      else{
        console.log(err)
      }
    })
  }
})


// Start server
let port = process.env.PORT
if (port == null || port == ''){
  port = 3000
}
app.listen(port, function(){
  console.log(port);
  console.log("Server has started successfully.")
})