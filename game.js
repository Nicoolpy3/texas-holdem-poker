// ===========================================
// Texas Hold'em Poker - Game Logic
// ===========================================

// Card and Deck Management
class Card {
    constructor(rank, suit) {
        this.rank = rank; // 2-14 (11=J, 12=Q, 13=K, 14=A)
        this.suit = suit; // 0=♠, 1=♥, 2=♦, 3=♣
    }

    getRankSymbol() {
        const symbols = {
            11: 'J', 12: 'Q', 13: 'K', 14: 'A'
        };
        return symbols[this.rank] || this.rank.toString();
    }

    getSuitSymbol() {
        const symbols = ['♠', '♥', '♦', '♣'];
        return symbols[this.suit];
    }

    getColor() {
        return (this.suit === 1 || this.suit === 2) ? 'red' : 'black';
    }

    toString() {
        return `${this.getRankSymbol()}${this.getSuitSymbol()}`;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (let suit = 0; suit < 4; suit++) {
            for (let rank = 2; rank <= 14; rank++) {
                this.cards.push(new Card(rank, suit));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }

    dealMultiple(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.deal());
        }
        return cards;
    }
}

// Hand Evaluator
class HandEvaluator {
    static getHandStrength(cards) {
        if (cards.length === 0) return { strength: 0, name: '无牌' };
        if (cards.length < 2) return { strength: 0, name: '单张' };

        // Get best 5-card hand from available cards
        const allCombinations = this.getCombinations(cards, 5);
        let bestHand = { strength: 0, name: '高牌' };

        for (const combo of allCombinations) {
            const hand = this.evaluate5Cards(combo);
            if (hand.strength > bestHand.strength) {
                bestHand = hand;
            }
        }

        return bestHand;
    }

    static evaluate5Cards(cards) {
        const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        
        const isFlush = suits.every(s => s === suits[0]);
        const isStraight = this.checkStraight(ranks);
        
        const rankCounts = {};
        ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
        
        const counts = Object.values(rankCounts).sort((a, b) => b - a);
        const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);

        // Royal Flush
        if (isFlush && isStraight && ranks[0] === 14 && ranks[4] === 10) {
            return { strength: 900, name: '皇家同花顺', tiebreak: ranks };
        }

        // Straight Flush
        if (isFlush && isStraight) {
            return { strength: 800, name: '同花顺', tiebreak: ranks };
        }

        // Four of a Kind
        if (counts[0] === 4) {
            const quadRank = parseInt(Object.keys(rankCounts).find(key => rankCounts[key] === 4));
            return { strength: 700, name: '四条', tiebreak: [quadRank] };
        }

        // Full House
        if (counts[0] === 3 && counts[1] === 2) {
            const tripRank = parseInt(Object.keys(rankCounts).find(key => rankCounts[key] === 3));
            const pairRank = parseInt(Object.keys(rankCounts).find(key => rankCounts[key] === 2));
            return { strength: 600, name: '葫芦', tiebreak: [tripRank, pairRank] };
        }

        // Flush
        if (isFlush) {
            return { strength: 500, name: '同花', tiebreak: ranks };
        }

        // Straight
        if (isStraight) {
            return { strength: 400, name: '顺子', tiebreak: ranks };
        }

        // Three of a Kind
        if (counts[0] === 3) {
            const tripRank = parseInt(Object.keys(rankCounts).find(key => rankCounts[key] === 3));
            return { strength: 300, name: '三条', tiebreak: [tripRank] };
        }

        // Two Pair
        if (counts[0] === 2 && counts[1] === 2) {
            const pairs = Object.keys(rankCounts).filter(key => rankCounts[key] === 2).map(Number).sort((a, b) => b - a);
            const kicker = Object.keys(rankCounts).filter(key => rankCounts[key] === 1).map(Number)[0];
            return { strength: 200, name: '两对', tiebreak: [...pairs, kicker] };
        }

        // One Pair
        if (counts[0] === 2) {
            const pairRank = parseInt(Object.keys(rankCounts).find(key => rankCounts[key] === 2));
            const kickers = Object.keys(rankCounts).filter(key => rankCounts[key] === 1).map(Number).sort((a, b) => b - a);
            return { strength: 100, name: '一对', tiebreak: [pairRank, ...kickers] };
        }

        // High Card
        return { strength: 0, name: '高牌', tiebreak: ranks };
    }

    static checkStraight(ranks) {
        const sorted = [...new Set(ranks)].sort((a, b) => b - a);
        
        // Normal straight
        if (sorted.length >= 5) {
            for (let i = 0; i <= sorted.length - 5; i++) {
                if (sorted[i] - sorted[i + 4] === 4) {
                    return true;
                }
            }
        }

        // Wheel straight (A-2-3-4-5)
        if (sorted.includes(14) && sorted.includes(2) && sorted.includes(3) && sorted.includes(4) && sorted.includes(5)) {
            return true;
        }

        return false;
    }

    static getCombinations(array, k) {
        if (k === 0) return [[]];
        if (array.length === 0) return [];
        
        const [head, ...tail] = array;
        const withHead = this.getCombinations(tail, k - 1).map(c => [head, ...c]);
        const withoutHead = this.getCombinations(tail, k);
        
        return [...withHead, ...withoutHead];
    }
}

// Player Class
class Player {
    constructor(name, chips, isAI = true) {
        this.name = name;
        this.chips = chips;
        this.hand = [];
        this.isAI = isAI;
        this.currentBet = 0;
        this.isFolded = false;
        this.isAllIn = false;
        this.lastAction = null;
    }

    resetHand() {
        this.hand = [];
        this.currentBet = 0;
        this.isFolded = false;
        this.isAllIn = false;
        this.lastAction = null;
    }

    bet(amount) {
        const actualAmount = Math.min(amount, this.chips);
        this.chips -= actualAmount;
        this.currentBet += actualAmount;
        
        if (this.chips === 0) {
            this.isAllIn = true;
        }
        
        return actualAmount;
    }

    fold() {
        this.isFolded = true;
    }

    clearBet() {
        this.currentBet = 0;
    }
}

// Game Class
class TexasHoldemGame {
    constructor() {
        this.deck = new Deck();
        this.players = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.dealerPosition = 0;
        this.currentPlayerIndex = 0;
        this.phase = 'preflop'; // preflop, flop, turn, river, showdown
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.minRaise = this.bigBlind;
        this.gameStarted = false;
        this.handNumber = 1;
        
        this.initAIPlayers();
        this.setupEventListeners();
        this.updateUI();
    }

    initAIPlayers() {
        const playerNames = ['你', 'Alex', 'Bob', 'Charlie', 'Diana', 'Eve'];
        const startingChips = 1000;
        
        this.players = playerNames.map((name, index) => {
            return new Player(name, startingChips, index !== 0);
        });
    }

    setupEventListeners() {
        // Action buttons
        document.getElementById('btn-fold').addEventListener('click', () => this.playerAction('fold'));
        document.getElementById('btn-check').addEventListener('click', () => this.playerAction('check'));
        document.getElementById('btn-call').addEventListener('click', () => this.playerAction('call'));
        document.getElementById('btn-raise').addEventListener('click', () => this.showRaiseControls());
        document.getElementById('btn-allin').addEventListener('click', () => this.playerAction('allin'));
        document.getElementById('btn-confirm-raise').addEventListener('click', () => this.confirmRaise());
        
        // Bet slider
        const slider = document.getElementById('bet-slider');
        slider.addEventListener('input', (e) => {
            document.getElementById('bet-amount-display').textContent = e.target.value;
        });

        // Chip buttons
        document.querySelectorAll('.btn-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.textContent.replace('$', ''));
                slider.value = amount;
                document.getElementById('bet-amount-display').textContent = amount;
            });
        });

        // Modal buttons
        document.getElementById('btn-next-hand').addEventListener('click', () => this.startNextHand());
        document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
    }

    startNewGame() {
        this.handNumber = 1;
        this.players.forEach(p => {
            p.chips = 1000;
            p.resetHand();
        });
        this.dealerPosition = 0;
        this.hideModal();
        this.startHand();
        this.log('=== 新游戏开始 ===', true);
    }

    startNextHand() {
        this.handNumber++;
        this.players.forEach(p => p.resetHand());
        this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
        this.hideModal();
        this.startHand();
    }

    startHand() {
        this.deck.reset();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = this.bigBlind;
        this.phase = 'preflop';
        this.gameStarted = true;
        
        // Reset player bets
        this.players.forEach(p => {
            p.clearBet();
            p.lastAction = null;
        });

        // Post blinds
        const sbPos = (this.dealerPosition + 1) % this.players.length;
        const bbPos = (this.dealerPosition + 2) % this.players.length;
        
        this.players[sbPos].bet(this.smallBlind);
        this.players[bbPos].bet(this.bigBlind);
        
        this.pot = this.smallBlind + this.bigBlind;
        
        // Deal hole cards
        this.players.forEach(p => {
            p.hand = this.deck.dealMultiple(2);
        });

        // Set starting player (UTG - under the gun)
        this.currentPlayerIndex = (this.dealerPosition + 3) % this.players.length;
        
        this.log(`\n=== 第 ${this.handNumber} 局 ===`);
        this.log(`盲注：$${this.smallBlind}/$${this.bigBlind}`);
        this.log(`${this.players[sbPos].name} 下小盲 $${this.smallBlind}`);
        this.log(`${this.players[bbPos].name} 下大盲 $${this.bigBlind}`);
        
        this.updateUI();
        this.updateActionButtons();
        
        // Check if it's player's turn
        if (!this.players[this.currentPlayerIndex].isAI) {
            this.showMessage('轮到你了！');
        } else {
            this.showMessage(`${this.players[this.currentPlayerIndex].name} 思考中...`);
            setTimeout(() => this.aiTurn(), 1500);
        }
    }

    playerAction(action) {
        const player = this.players[0]; // Human player
        
        if (action === 'fold') {
            player.fold();
            player.lastAction = '弃牌';
            this.log(`${player.name} 弃牌`);
        } else if (action === 'check') {
            player.lastAction = '过牌';
            this.log(`${player.name} 过牌`);
        } else if (action === 'call') {
            const callAmount = this.currentBet - player.currentBet;
            player.bet(callAmount);
            this.pot += callAmount;
            player.lastAction = '跟注';
            this.log(`${player.name} 跟注 $${callAmount}`);
        } else if (action === 'allin') {
            const allInAmount = player.chips;
            player.bet(allInAmount);
            this.pot += allInAmount;
            player.lastAction = '全下';
            this.log(`${player.name} 全下 $${allInAmount}`, true);
        }
        
        this.updateUI();
        this.nextPlayer();
    }

    showRaiseControls() {
        const player = this.players[0];
        const minRaise = this.currentBet + this.minRaise;
        const maxRaise = player.chips + player.currentBet;
        
        const slider = document.getElementById('bet-slider');
        slider.min = minRaise;
        slider.max = maxRaise;
        slider.value = minRaise;
        
        document.getElementById('bet-amount-display').textContent = minRaise;
        
        document.getElementById('action-buttons').style.display = 'none';
        document.getElementById('bet-controls').style.display = 'flex';
    }

    confirmRaise() {
        const player = this.players[0];
        const raiseTotal = parseInt(document.getElementById('bet-slider').value);
        const raiseAmount = raiseTotal - player.currentBet;
        
        player.bet(raiseAmount);
        this.pot += raiseAmount;
        this.currentBet = raiseTotal;
        player.lastAction = `加注到 $${raiseTotal}`;
        
        this.log(`${player.name} 加注到 $${raiseTotal}`, true);
        
        document.getElementById('action-buttons').style.display = 'flex';
        document.getElementById('bet-controls').style.display = 'none';
        
        this.updateUI();
        this.nextPlayer();
    }

    aiTurn() {
        if (!this.gameStarted) return;
        
        const player = this.players[this.currentPlayerIndex];
        
        if (player.isFolded || player.isAllIn) {
            this.nextPlayer();
            return;
        }
        
        // Simple AI logic
        const handStrength = HandEvaluator.getHandStrength([...player.hand, ...this.communityCards]);
        const callAmount = this.currentBet - player.currentBet;
        const potOdds = callAmount / (this.pot + callAmount);
        
        let action = 'fold';
        const random = Math.random();
        
        // Preflop AI logic
        if (this.phase === 'preflop') {
            const cardSum = player.hand[0].rank + player.hand[1].rank;
            const isPair = player.hand[0].rank === player.hand[1].rank;
            const isSuited = player.hand[0].suit === player.hand[1].suit;
            
            if (isPair || cardSum >= 20 || (isSuited && cardSum >= 18)) {
                if (random > 0.7 && callAmount === 0) {
                    action = 'raise';
                } else if (callAmount === 0) {
                    action = 'check';
                } else {
                    action = 'call';
                }
            } else if (cardSum >= 15 || (isSuited && cardSum >= 13)) {
                action = callAmount === 0 ? 'check' : 'call';
            } else {
                action = callAmount === 0 ? 'check' : (random > 0.6 ? 'call' : 'fold');
            }
        } else {
            // Postflop AI logic
            if (handStrength.strength >= 100 || random > 0.7) {
                if (random > 0.8 && callAmount === 0) {
                    action = 'raise';
                } else if (callAmount === 0) {
                    action = 'check';
                } else {
                    action = 'call';
                }
            } else if (handStrength.strength >= 0 || random > 0.5) {
                action = callAmount === 0 ? 'check' : (random > 0.4 ? 'call' : 'fold');
            } else {
                action = callAmount === 0 ? 'check' : 'fold';
            }
        }
        
        // Execute AI action
        if (action === 'fold') {
            player.fold();
            player.lastAction = '弃牌';
            this.log(`${player.name} 弃牌`);
        } else if (action === 'check') {
            player.lastAction = '过牌';
            this.log(`${player.name} 过牌`);
        } else if (action === 'call') {
            player.bet(callAmount);
            this.pot += callAmount;
            player.lastAction = '跟注';
            this.log(`${player.name} 跟注 $${callAmount}`);
        } else if (action === 'raise') {
            const raiseAmount = Math.min(this.currentBet + this.minRaise, player.chips + player.currentBet);
            const actualRaise = raiseAmount - player.currentBet;
            player.bet(actualRaise);
            this.pot += actualRaise;
            this.currentBet = raiseAmount;
            player.lastAction = `加注到 $${raiseAmount}`;
            this.log(`${player.name} 加注到 $${raiseAmount}`, true);
        }
        
        this.updateUI();
        setTimeout(() => this.nextPlayer(), 1000);
    }

    nextPlayer() {
        // Check if only one player remains
        const activePlayers = this.players.filter(p => !p.isFolded);
        if (activePlayers.length === 1) {
            this.endHand(activePlayers[0]);
            return;
        }
        
        // Check if betting round is complete
        const activeNotAllIn = activePlayers.filter(p => !p.isAllIn);
        const allCalled = activeNotAllIn.every(p => p.currentBet === this.currentBet || p.isFolded);
        const everyoneActed = activeNotAllIn.every(p => p.lastAction !== null);
        
        if (allCalled && everyoneActed && activeNotAllIn.length > 0) {
            this.nextPhase();
            return;
        }
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Skip folded and all-in players
        let loops = 0;
        while ((this.players[this.currentPlayerIndex].isFolded || 
                this.players[this.currentPlayerIndex].isAllIn) && 
                loops < this.players.length) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            loops++;
        }
        
        this.updateUI();
        this.updateActionButtons();
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        if (!currentPlayer.isAI) {
            this.showMessage('轮到你了！');
        } else {
            this.showMessage(`${currentPlayer.name} 思考中...`);
            setTimeout(() => this.aiTurn(), 1500);
        }
    }

    nextPhase() {
        // Reset bets for new round
        this.players.forEach(p => p.clearBet());
        this.currentBet = 0;
        this.currentPlayerIndex = (this.dealerPosition + 1) % this.players.length;
        
        // Skip to first active player
        while (this.players[this.currentPlayerIndex].isFolded) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        }
        
        if (this.phase === 'preflop') {
            this.phase = 'flop';
            this.communityCards = this.deck.dealMultiple(3);
            this.log('\n--- 翻牌圈 ---', true);
            this.log(`公共牌：${this.communityCards.map(c => c.toString()).join(' ')}`);
        } else if (this.phase === 'flop') {
            this.phase = 'turn';
            this.communityCards.push(this.deck.deal());
            this.log('\n--- 转牌圈 ---', true);
            this.log(`公共牌：${this.communityCards.map(c => c.toString()).join(' ')}`);
        } else if (this.phase === 'turn') {
            this.phase = 'river';
            this.communityCards.push(this.deck.deal());
            this.log('\n--- 河牌圈 ---', true);
            this.log(`公共牌：${this.communityCards.map(c => c.toString()).join(' ')}`);
        } else if (this.phase === 'river') {
            this.showdown();
            return;
        }
        
        this.players.forEach(p => p.lastAction = null);
        this.updateUI();
        this.updateActionButtons();
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer.isAI) {
            this.showMessage('轮到你了！');
        } else {
            this.showMessage(`${currentPlayer.name} 思考中...`);
            setTimeout(() => this.aiTurn(), 1500);
        }
    }

    showdown() {
        this.phase = 'showdown';
        this.log('\n=== 摊牌 ===', true);
        
        const activePlayers = this.players.filter(p => !p.isFolded);
        
        // Evaluate all hands
        const results = activePlayers.map(p => {
            const hand = HandEvaluator.getHandStrength([...p.hand, ...this.communityCards]);
            return { player: p, hand: hand };
        });
        
        // Sort by strength
        results.sort((a, b) => {
            if (b.hand.strength !== a.hand.strength) {
                return b.hand.strength - a.hand.strength;
            }
            // Compare tiebreakers
            for (let i = 0; i < Math.max(a.hand.tiebreak.length, b.hand.tiebreak.length); i++) {
                const aVal = a.hand.tiebreak[i] || 0;
                const bVal = b.hand.tiebreak[i] || 0;
                if (bVal !== aVal) return bVal - aVal;
            }
            return 0;
        });
        
        // Find winner(s)
        const winner = results[0];
        this.log(`${winner.player.name} 获胜！牌型：${winner.hand.name}`, true);
        this.log(`底池：$${this.pot}`);
        
        // Show all hands
        activePlayers.forEach(p => {
            const hand = HandEvaluator.getHandStrength([...p.hand, ...this.communityCards]);
            this.log(`${p.name}: ${p.hand.map(c => c.toString()).join(' ')} - ${hand.name}`);
        });
        
        this.endHand(winner.player);
    }

    endHand(winner) {
        winner.chips += this.pot;
        this.log(`\n🎉 ${winner.name} 赢得 $${this.pot}！`, true);
        this.log(`${winner.name} 筹码：$${winner.chips}`);
        
        this.updateUI();
        
        // Show winner modal
        const modal = document.getElementById('winner-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        
        if (winner === this.players[0]) {
            modalTitle.textContent = '🎉 获胜!';
            modalMessage.textContent = `你赢得了 $${this.pot}！牌型不错！`;
        } else {
            modalTitle.textContent = winner.isAI ? `${winner.name} 获胜` : '游戏结束';
            modalMessage.textContent = `${winner.name} 赢得了底池 $${this.pot}`;
        }
        
        modal.classList.add('show');
        
        this.gameStarted = false;
    }

    updateUI() {
        // Update pot
        document.getElementById('pot-amount').textContent = this.pot;
        document.getElementById('pot-display').textContent = this.pot;
        
        // Update phase
        const phaseNames = {
            'preflop': '发牌前',
            'flop': '翻牌圈',
            'turn': '转牌圈',
            'river': '河牌圈',
            'showdown': '摊牌'
        };
        document.getElementById('current-phase').textContent = phaseNames[this.phase] || this.phase;
        
        // Update phase indicator
        const phases = ['preflop', 'flop', 'turn', 'river'];
        document.querySelectorAll('.phase-dot').forEach(dot => {
            const dotPhase = dot.dataset.phase;
            const currentIndex = phases.indexOf(this.phase);
            const dotIndex = phases.indexOf(dotPhase);
            
            dot.classList.remove('active', 'completed');
            if (dotIndex === currentIndex) {
                dot.classList.add('active');
            } else if (dotIndex < currentIndex) {
                dot.classList.add('completed');
            }
        });
        
        // Update community cards
        const communityContainer = document.getElementById('community-cards');
        const communityLabel = communityContainer.querySelector('.community-label');
        communityContainer.innerHTML = '';
        communityContainer.appendChild(communityLabel);
        
        this.communityCards.forEach(card => {
            communityContainer.appendChild(this.createCardElement(card));
        });
        
        // Add placeholder cards for empty slots
        for (let i = this.communityCards.length; i < 5; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'card hidden';
            communityContainer.appendChild(placeholder);
        }
        
        // Update player seats
        this.updatePlayerSeats();
    }

    updatePlayerSeats() {
        const table = document.getElementById('poker-table');
        
        // Remove existing seats
        document.querySelectorAll('.player-seat').forEach(seat => seat.remove());
        
        this.players.forEach((player, index) => {
            const seat = document.createElement('div');
            seat.className = `player-seat seat-${index}`;
            
            if (index === this.currentPlayerIndex && this.gameStarted && !player.isFolded) {
                seat.classList.add('active');
            }
            
            // Dealer button
            const isDealer = index === this.dealerPosition;
            
            // Check if folded
            const isFolded = player.isFolded;
            
            // Create seat HTML
            seat.innerHTML = `
                <div class="player-action ${player.lastAction ? 'show' : ''}">${player.lastAction || ''}</div>
                <div class="player-avatar ${isDealer ? 'dealer' : ''}">
                    ${player.name.charAt(0)}
                </div>
                ${player.hand.length > 0 ? `
                <div class="player-cards">
                    ${player.hand.map(card => this.createCardElement(card, player.isAI && this.phase !== 'showdown').outerHTML).join('')}
                </div>
                ` : ''}
                <div class="player-info">
                    <div class="player-name ${isFolded ? 'folded' : ''}">${player.name}</div>
                    <div class="player-chips">$${player.chips}</div>
                    ${player.hand.length > 0 && this.phase !== 'preflop' && !isFolded ? `
                        <div class="hand-strength">
                            ${HandEvaluator.getHandStrength([...player.hand, ...this.communityCards]).name}
                        </div>
                    ` : ''}
                </div>
            `;
            
            table.appendChild(seat);
        });
    }

    createCardElement(card, hidden = false) {
        const div = document.createElement('div');
        
        if (hidden) {
            div.className = 'card hidden';
            return div;
        }
        
        div.className = `card ${card.getColor()}`;
        div.innerHTML = `
            <div class="card-top">
                <span>${card.getRankSymbol()}</span>
                <span>${card.getSuitSymbol()}</span>
            </div>
            <div class="card-center">${card.getSuitSymbol()}</div>
            <div class="card-bottom">
                <span>${card.getRankSymbol()}</span>
                <span>${card.getSuitSymbol()}</span>
            </div>
        `;
        
        return div;
    }

    updateActionButtons() {
        const player = this.players[0];
        const isPlayerTurn = this.currentPlayerIndex === 0 && this.gameStarted && !player.isFolded;
        
        document.getElementById('btn-fold').disabled = !isPlayerTurn;
        document.getElementById('btn-check').disabled = !isPlayerTurn || this.currentBet > player.currentBet;
        document.getElementById('btn-call').disabled = !isPlayerTurn || this.currentBet <= player.currentBet;
        document.getElementById('btn-raise').disabled = !isPlayerTurn || player.chips === 0;
        document.getElementById('btn-allin').disabled = !isPlayerTurn || player.chips === 0;
        
        // Hide bet controls by default
        document.getElementById('bet-controls').style.display = 'none';
        document.getElementById('action-buttons').style.display = 'flex';
    }

    showMessage(message) {
        document.getElementById('game-message').textContent = message;
    }

    log(message, highlight = false) {
        const logContainer = document.getElementById('game-log');
        const entry = document.createElement('div');
        entry.className = `log-entry${highlight ? ' highlight' : ''}`;
        entry.textContent = message;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    hideModal() {
        document.getElementById('winner-modal').classList.remove('show');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TexasHoldemGame();
    
    // Auto-start first hand after a short delay
    setTimeout(() => {
        window.game.startHand();
    }, 1000);
});
