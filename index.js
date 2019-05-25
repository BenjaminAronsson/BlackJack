Vue.component("popup", {
  template: `
  <v-dialog max-width="500px">
        <v-card>
          <v-card-title>
            <span>Dialog 3</span>
            <v-spacer></v-spacer>
            <v-menu bottom left>
              <template v-slot:activator="{ on }">
                <v-btn icon v-on="on">
                  <v-icon>more_vert</v-icon>
                </v-btn>
              </template>
              
            </v-menu>
          </v-card-title>
          <v-card-actions>
            <v-btn color="primary" flat @click="showPopUp=false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  `
})

Vue.component("card", {
  //props letar efter namnet i app properties
  props: ["myCard"],
  template: `
    <div :class="cardColor(this.myCard)" tag>
      <div class="top">
        {{prettyCard(this.myCard)}}
      </div>
      
      <div class="card-mid">
        {{centerText(prettyCard(this.myCard))}}
      </div>
      
      <div class="card-bottom">
        {{prettyCard(this.myCard)}}
      </div>
    </div>
  `,
  methods: {

    centerText(cardStr) {
      var newStr = cardStr.slice(0, cardStr.length-1);
      return newStr
    },

    cardColor(card) {
      let color = "card-black"
      if (this.myCard.suit === "HEARTS" || this.myCard.suit === "DIAMONDS" ) {
        color = "card-red"
      } 
      return color + " card"
    },
  
    prettyCard(card) {
      let s = card.suit
      let value = card.value
      const suits = ['HEARTS', 'SPADES', 'DIAMONDS', 'CLUBS']
      const symbol = ["♥","♠","♦","♣"]
    
      switch (value) {
        case 1:
          value = "A"
        break;
        case 10:
          value = "10"
          break;
        case 11:
          value = "J"
          break;
        case 12:
          value = "Q"
          break;
        case 13:
          value = "K"
          break;
        default:
      }
      for (var i = 0; i < 4; i++) {
        if (s === suits[i]) {
          s = symbol[i]
        }
      }
      return value + String(s)
    }
  }
})

Vue.component("game", {
computed: {
  disableDraw: function () {
    // `this` points to the vm instance
    if (this.currentPlayer == 0 ) {
      return true
    } else {
      return this.players[this.currentPlayer].score > 21
    }
  },
},
//TODO: call this on restart
created() {
  this.deck = this.createDeck()
  this.shuffle(this.deck)
  this.drawCard()
  this.nextPlayer()
},
data() {
  return {
    currentPlayer: 0,
    deck: null
  }
},
props: {
  players: {
    type: Array,
    default () { 
        let ps = [{name: "Darth Vader", score: 10, credits: 100, 
            hand: [
              {value: 1, suit: "SPADES"}, {value: 1, suit: "SPADES"}
            ]
          }
        ]
      return ps
    }
  }
},
methods:{
  
  drawCard() { 
    let p = this.players[this.currentPlayer]
    p.hand.push(this.deck[this.deck.length-1])
    this.deck.pop()

    //update player score
    p.score = this.score(p.hand)
  },

  nextPlayer() {
    if(this.currentPlayer === this.players.length - 1) {
      this.currentPlayer = 0
    } else {
      this.currentPlayer ++
    }
  },

  dealersTurn() {
    let dealer = this.players[this.currentPlayer]
    let draw = this.drawCard

    async function delay(delayInms) {
      return new Promise(resolve  => {
        setTimeout(() => {
          resolve(2);
        }, delayInms);
      });
    }
    async function fillhand() {
      while(dealer.score < 18)
      {
        await delay(1000);
        draw()
      } 
      store.commit('endGame')
      this.created()
    }
    fillhand() 
  },

  hold() { 
    this.nextPlayer()

    //if dealer
    if(this.currentPlayer === 0) {
      //dealer turn
      let dealer = this.players[this.currentPlayer]
      this.dealersTurn()
      let winner = this.leadingPlayer()

      let message = 'Game ended'
      if(winner === dealer) {
        message = 'You lose!'
      } else {
        message = 'You won!'
      }
      store.commit('setEndMessage', message)
    }
  },

  leadingPlayer() {
    let winningPlayer = null

    this.players.forEach(player => {
      if(player.score <= 21) {
        if(winningPlayer === null) {
          winningPlayer = player
        }
        else if( winningPlayer.score < player.score) {
          winningPlayer = player
        }
      }
    })
    return winningPlayer
  },

  shuffle(cards) {
    for (var i = 0; i < cards.length; i++) {
      let r = Math.floor((Math.random() *cards.length))
      let temp = cards[r]
      cards[r] = cards[i]
      cards[i] = temp
    }
  },

  score(cards) {
    let score = 0
    let numberOfAces = 0
    for (var i = 0; i < cards.length; i++) {
  
      let value = cards[i].value
        if (value === 1) {
          numberOfAces += 1
          score += 11
        } else if (value >= 10) {
          score += 10
        } else {
          score += value
        }
      }
      for (var i = 0; i < numberOfAces; i++) {
        if (score > 21) {
          score -= 10
        }
      }
    return score
  },
  
  createDeck() {
    let deck = []
    const suits = ['HEARTS', 'SPADES', 'DIAMONDS', 'CLUBS']
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 13; j++) {
        let myCard = {
          suit: suits[i],
          value: j + 1
          }
      deck.push(myCard)
      }
    }
    return deck
  },
  isActive(pIndex) {
    if (pIndex === this.currentPlayer) {
      return "active-player"
    } else {
      return "inactive-player"
    }
    
  }
},

template:`
<div>
  <h1>BlackJack</h1>
  <v-btn type="button" dark class="red darken-4" @click="drawCard" :disabled="disableDraw">Hit</v-btn>
  
  <v-btn type="button" flat dark class="red darken-4" @click="hold">Hold</v-btn><br>
  
  <div class="plain" v-for="player, indexP in players">
    <h4 :class="isActive(indexP)">{{player.name}}: {{player.score}}</h4>
    <div class="hand">
      <div v-for="card, indexC in player.hand">
          <card :my-card="players[indexP].hand[indexC]"></card>
      </div>
    </div>
  </div>
</div>
`
})




const Home = Vue.component('home', {
  // TODO: link players to app -> data -> players

  computed: {
    players() {
      return this.$store.state.players
    }
  },
  template: '<v-container><game v-bind:players="players"></game></v-container>'
})



  const NotFound = Vue.component('not-found', {
    template: `
    <v-container>
      <div v-ripple="{ center: true }" 
      class="text-xs-center red darken-4 elevation-2 pa-5 headline">
        Page not found
      </div>
    </v-container>`
  })

 const One = Vue.component('one', {
    template: `
        <div>
            <div v-if="$route.params.test">
                {{$route.params.test}}{{$route.params.test2}}
            </div>
            <div v-else>
                One
            </div>
        </div>
        `
  })
  
  const Two = Vue.component('two', {
    template: `
        <div>
            <div v-if="$route.params.test">
                {{$route.params.test}}{{$route.params.test2}}
            </div>
            <div v-else>
                 One
            </div>
        </div>
        `
  })

  const router = new VueRouter( {
    routes: [ {
        component: Home,
        path: '/'
        }, {
        component: One,
        path: '/one/:test?/:test2?'
        }, {
        component: NotFound,
        path: '/404' }, {
        redirect: '/404',
        path: '*'
     }  
    ]
})

const store = new Vuex.Store({
  state: {
    players: [
      {
        name: "Dealer", score: 0, credits: 100, hand: []
      },
      {
        name: "Jon", score: 0, credits: 100, hand: []
      }
    ],
    isGameEnded: false,
    endMessage: 'Game has ended!'
  },
  mutations: {
    endGame (state) {
      // mutate state
      state.isGameEnded = true
    },
    startGame (state) {
      // mutate state
      state.isGameEnded = false
    },
    setEndMessage (state, message) {
      // mutate state
      state.endMessage = message
    },
    restartGame(state) {
      state.isGameEnded = false
      state.players.forEach(player => {
        player.hand = []
        player.score = 0
        
      })
    },
    // disableDraw(state) {
    //   // `this` points to the vm instance
    //   if (this.currentPlayer == 0 ) {
    //     return true
    //   } else {
    //     return this.players[this.currentPlayer].score > 21
    //   }
    // }
  }  
})

var app = new Vue({
  store,
  router,
  el: "#app",
  data: {
      drawer: null,
      showPopUp: true
  },
  methods: {
    restartGame() {
      console.log("TODO: restart game");
    },
    changePlayers() {
      console.log("TODO: change players");
      
    }
  }
})