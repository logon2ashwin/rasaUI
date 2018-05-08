'use strict';

// global variables
var templateurl = "http://localhost:9090/api/v1/"

var nlustories = {
    stories: {
        story_name: 'topper',
        story_data: [
            {
                name: 'topper',
                utterences: [
                    {
                        name: 'utter_topper_result',
                        type: 'text',
                        text: 'Dinesh is the topper'
                    }
                ],
                inputs: [
                    {
                        text: 'who is the topper in class 10',
                        entities: [{
                            "start": 31,
                            "end": 36,
                            "value": "north",
                            "entity": "location"
                        }]
                    }
                ],
            },
            {
                name: 'choose_class',
                utterences: [
                    {
                        name: 'utter_choose_class',
                        type: 'buttons',
                        buttons: [
                            { title: 'class10', payload: 'for class 10?' },
                            { title: 'class9', payload: 'for class 9?' }
                        ]
                    }
                ],
                inputs: [
                    {
                        text: 'Who is the topper?',
                        entities: [{
                            "start": 31,
                            "end": 36,
                            "value": "north",
                            "entity": "location"
                        }]
                    }
                ]
            }
        ]
    }
};


// components
Vue.component('agentmodal', {
    template: '#agent-modal-template',
    data : function(){
        return{
            agent : {}
        }
    },
    methods : {
        createAgents(data){
            const self = this;
            axios.post(templateurl+'agents', data)
            .then(function (response) {
                self.$emit('close');
            })
            .catch(function (err) {
                
            });
        }
    }
})

Vue.component('editagentmodal', {
    props: ['agent'],
    template: '#edit-agent-modal-template',
    methods : {
        updateAgents(data){
            const self = this;
            axios.put(templateurl+'agents', data)
            .then(function (response) {
                self.$emit('close');
            })
            .catch(function (err) {
                
            });
        }
    }
})

Vue.component('createstorymodal', {
    props: ['agentid'],
    template: '#create-story-modal',
    data : function(){
        return{
            story : {}
        }
    },
    methods : {
        createStory(data){
            const self = this;
            axios.post(templateurl+'stories?agentid='+this.agentid, data)
            .then(function (response) {
                self.$emit('close');
            })
            .catch(function (err) {
                
            });
        }
    }
})

Vue.component('editstorymodal', {
    props: ['story'],
    template: '#edit-story-modal-template',
    methods : {
        updateStories(data){
            const self = this;
            axios.put(templateurl+'stories', data)
            .then(function (response) {
                self.$emit('close');
            })
            .catch(function (err) {
                
            });
        }
    }
})


// router controllers
const agents = {
    template: '#intents',
    data: function () {
        return {
            loading: false,
            agents: {},
            error: null,
            showModal : false,
            showEditModal : false
        }
    },
    created() {
        this.fetchAgents()
    },
    watch: {
        '$route': 'fetchAgents'
    },
    methods: {
        fetchAgents() {
            const self = this;
            axios.get(templateurl+'agents')
                .then(function (response) {
                    self.agents = response.data;
                })
                .catch(function (err) {
                    console.log(err);
                });
        },
        deleteAgent(id){
            const self = this;
            axios.delete(templateurl+'agents?id='+id)
            .then(function(response){
                self.fetchAgents()
            })
            .catch(function(err){
                console.log(err);
            })
        },
        modalclose(){
            this.showModal = false;
            this.showEditModal = false;
            this.fetchAgents();
        }
    }
};

const storylist = {
    template: '#storieslist',
    props: ['id'],
    data: function () {
        return {
            storylist : [],
            showModal : false,
            showEditModal : false
        }
    },
    created () {
        this.fetchStories(this.$route.params.agentid)
    },
    methods : {
        fetchStories(agentid){
            const self = this;
            axios.get(templateurl+'stories?id='+agentid)
            .then(function (response) {
                self.storylist = response.data.stories;
            })
            .catch(function (err) {
                console.log(err);
            });
        },
        deletestory(id){
            const self = this;
            axios.delete(templateurl+'stories?id='+id)
            .then(function (response) {
                self.fetchStories(self.$route.params.agentid);
            })
            .catch(function (err) {
                console.log(err);
            });
        },
        modalclose(){
            this.showModal = false;
            this.showEditModal = false;
            this.fetchStories(this.$route.params.agentid);
        }
    }
}

const stories = {
    template: '#stories',
    data: function () {
        return {
            stories : {}
        };
    },
    created () {
        this.fetchStoryById(this.$route.params.storyid);
    },
    methods: {
        addIntent() {
            var newintent = {
                name: '',
                utterences: [
                    {
                        name: '',
                        type: '',
                        text: ''
                    }
                ],
                inputs: [
                    {
                        text: '',
                        entities: [{}]
                    }
                ]
            }
                this.stories.intents.push(newintent);
        },
        removeintent(index) {
            this.stories.intents.splice(index, 1);
        },
        addInput(intentIndex) {
            var input = {
                text: '',
                entities: [{}]
            }
            this.stories.intents[intentIndex].inputs.push(input);
        },
        removeInput(intentIndex, inputindex) {
            this.stories.intents[intentIndex].inputs.splice(inputindex, 1);
        },
        addEntity(intentIndex, inputindex) {
            var entity = {
                "value": "",
                "entity": ""
            }
            this.stories.intents[intentIndex].inputs[inputindex].entities.push(entity);
        },
        removeEntity(intentIndex, inputindex, entityindex) {
            this.stories.intents[intentIndex].inputs[inputindex].entities.splice(entityindex, 1);
        },
        addAction(intentIndex) {
            var temp = {
                name: '',
                type: 'text',
                text: ''
            }
            this.stories.intents[intentIndex].utterences.push(temp);
        },
        removeAction(intentIndex, utterenceIndex) {
            this.stories.intents[intentIndex].utterences.splice(utterenceIndex, 1);
        },
        buttonOnChange(intentindex, utterenceindex) {
            if (this.stories.intents[intentindex].utterences[utterenceindex].type == "buttons") {
                if (!this.stories.intents[intentindex].utterences[utterenceindex].buttons) {
                    this.stories.intents[intentindex].utterences[utterenceindex].buttons = [{ title: '', payload: '' }];
                } else if (this.stories.intents[intentindex].utterences[utterenceindex].buttons.length == 0) {
                    this.stories.intents[intentindex].utterences[utterenceindex].buttons = [{ title: '', payload: '' }];
                }
            }
        },
        addActionButton(intentindex, utterenceindex) {
            var temp = [{ title: '', payload: '' }]
            this.stories.intents[intentindex].utterences[utterenceindex].buttons.push(temp);
        },
        removeActionButton(intentindex, utterenceindex, buttonindex) {
            this.stories.intents[intentindex].utterences[utterenceindex].buttons.splice(buttonindex, 1);
        },
        fetchStoryById(id){
            const self = this;
            axios.get(templateurl+'stories/intents?id='+id)
            .then(function (response) {
                self.stories = response.data;
            })
            .catch(function (err) {
                console.log(err);
            });
        },
        saveStory(data){
            const self = this;
            axios.put(templateurl+'stories',data)
            .then(function (response) {
                self.fetchStoryById(this.$route.params.storyid);
            })
            .catch(function (err) {
                console.log(err);
            });
        }
    }
}

const graphs = {};





const routes = [
    { path: '/', component: agents },
    { path: '/stories/list/:agentid', name : 'storylist', component: storylist,  props: true },
    { path: '/graphs', component: graphs },
    { path: '/stories/:storyid', name : 'storydetails', component: stories, props: true }
]

// create router instanse
const router = new VueRouter({ routes })

// add router instance to app
const app = new Vue({
router,
}).$mount('#target')




