class SelectedItem extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var content = this.props.selection.length > 0 ?
            <h3>Users with <span className="active">{this.props.selection}</span> interest:</h3> :
            <h3>Please select an interest</h3>;
        var subscribedUsers = [];
        var userList = [];

        if (this.props.interests) {
            this.props.interests.forEach(interest => {
                if (interest.name == this.props.selection){
                    subscribedUsers = interest.subscribedUsers;
                }
            });
            for (var user of subscribedUsers) {
                userList.push(<li key={user}>{user}</li>)
            }
        }

        var showRemoveItemButton = subscribedUsers.includes(this.props.username)

        return (
            <React.Fragment>
                <div key={this.props.selection} id="status">
                    {content}
                    <div id="user-list">
                        <ul>
                            {userList}
                        </ul>
                    </div>
                </div>
            { showRemoveItemButton && 
                <button id="remove-interest" onClick={() => this.props.onRemoveItem()}>Remove Interest</button>
            }
            { !showRemoveItemButton && this.props.username && this.props.selection.length > 0 &&
                <button id="add-interest" onClick={() => this.props.onAddItem()}>Add Interest</button>
            }
            </React.Fragment>
        );
    }
}