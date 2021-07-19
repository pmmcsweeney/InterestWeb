class Input extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {value: ''}
    }

    handleChange(event) {
        this.setState({value: event.target.value});
        event.preventDefault();
    }

    handleSubmit(event) {
        this.props.onInputSubmit(this.state.value);
        this.setState({value: ''});
        event.preventDefault();
    }

    render() {
        if(this.props.hidden)
            return null;
        return (
            <div id="interest-input">
                <h3>Please enter an interest</h3>
                <form id="form" action="" onSubmit={(event) => this.handleSubmit(event)}>
                    <input id="input" autoComplete="off" onChange={(event) => this.handleChange(event)} /><button className="input-button">Enter</button>
                </form>
            </div>
        );
    }
}