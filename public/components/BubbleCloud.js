window.socket = io();

class BubbleCloud extends React.Component {
    constructor(props) {
        super(props);

        this.state = { jitter: 0.5, 
            username: '', 
            inputHidden: true,
            selectedInterest: '',
            chartData: {interests: []}
        };

        this.onUsernameSubmit = this.onUsernameSubmit.bind(this);
        this.onInputSubmit = this.onInputSubmit.bind(this);
        this.onRemoveItem = this.onRemoveItem.bind(this);
        this.onInterestSelected = this.onInterestSelected.bind(this);

        // Binding to the window to be called from vis.coffee when an interest is selected
        window.onInterestSelected = this.onInterestSelected;
    }
    onInterestSelected(selectedInterest) {
        this.setState({selectedInterest: selectedInterest});
    }
    onUsernameSubmit(value) {
        this.setState({
            username: value,
            inputHidden: false
        });
    }
    onInputSubmit(value) {
        if (value) {
            var data = {
                username: this.state.username,
                value: value,
            }
            socket.emit('submit interest', data);
        }
    }
    onRemoveItem() {
        var data = {
            username: this.state.username,
            value: this.state.selectedInterest
        }
    
        socket.emit('revoke interest', data);
    }
    render() {
        return (
            <div id="main" role="main">
                <Username onUsernameSubmit={this.onUsernameSubmit} />
                <Input hidden={this.state.inputHidden} onInputSubmit={this.onInputSubmit} />
                <div id="vis"></div>
                <SelectedItem selection={this.state.selectedInterest} 
                    interests={this.state.chartData.interests} 
                    username={this.state.username}
                    onRemoveItem={this.onRemoveItem} />
                <div id="controls">
                    <h3>Jitter</h3>
                    <form id="jitter">
                        <input type="range" min="0" max="400" defaultValue="100" style={{width: "240px"} } onInput={ (event) => this.updateOutput(event)} />
                        <output name="output" htmlFor="input">{this.state.jitter}</output>
                    </form>
                </div>
            </div>
        );
    }
    updateOutput(event) {
        this.setState({jitter: (event.target.value / 200).toFixed(3)});
    }
    displayChart(data) {
        var chart = document.getElementById('vis');

        chart.innerHTML = '';
        var newData = this.transformDataToBubbleChartInput(data);
        window.display(newData);
    }
    transformDataToBubbleChartInput(data) {
        var newData = [];
        data.interests.forEach(interest => newData.push({ name: interest.name, count: interest.subscribedUsers.length }));
        return newData;
    }
    componentDidMount() {
        socket.on('data update', function(data) {
            this.setState({chartData: data});
            this.displayChart(data);
        }.bind(this));
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevState.jitter !== this.state.jitter) {
            window.plot.jitter(this.state.jitter);
        }
    }
}