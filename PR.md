\*\* Get gql requests:
2.1. Get users, profiles, posts, memberTypes - 4 operations in one query.

<code>query queryType { getAll { users { id } profiles { id } posts { id } memberTypes { id } } }</code>

2.2. Get user, profile, post, memberType by id - 4 operations in one query.

<code>
query queryType($userId:ID!, $profileId:ID!, $postId:ID!, $memberTypeId:ID!) {
    getAllById(userId:$userId, 
    profileId:$profileId, 
    postId:$postId, 
    memberTypeId:$memberTypeId) {
        user { id }
        profile {
            id,
            userId
        }
        post {
            id
            userId
        }
        memberType { id }
    }
}
</code>

#Variables
<code>
{
"userId":"f5321416-aa33-48b9-9c13-02d177833332",
"profileId":"fe02b100-0f13-4894-8206-0f8aabd3283f",
"postId":"95abee72-2ebc-4965-bd7f-8900ff0aba0d",
"memberTypeId":"business"
}
</code>

2.3. Get users with their posts, profiles, memberTypes.

<code> 
query queryType {
        getUsers {
            users {
                user { id }
                profile {
                    id
                    userId
                }
                posts {
                    id
                    userId
                }
                memberType {
                    id
                }
            }
        }
}
</code>

#Variables
<code>
{
"userId":"f5321416-aa33-48b9-9c13-02d177833332",
"profileId":"fe02b100-0f13-4894-8206-0f8aabd3283f",
"postId":"95abee72-2ebc-4965-bd7f-8900ff0aba0d",
"memberTypeId":"business"
}
</code>

2.4. Get user by id with his posts, profile, memberType.

<code>
query queryType($userId:ID!) {
            getUser(id:$userId) {
                user { id }
                profile {
                    id,
                    userId
                }
                posts {
                    id
                    userId
                }
                memberType {
                    id
                }
            }
        }
</code>

#variable
<code>
"userId":"f5321416-aa33-48b9-9c13-02d177833332",
</code>

2.5. Get users with their userSubscribedTo, profile.

<code>
query queryType {
        getUsersWithUserSubscribedToProfiles {
        users {
            id
            firstName
            lastName
            email
            subscribedToUserIds
            profile { id }
            userSubscribedTo { id }
        }
    }
}
</code>

2.6. Get user by id with his subscribedToUser, posts.
2.7. Get users with their userSubscribedTo, subscribedToUser (additionally for each user in userSubscribedTo, subscribedToUser add their userSubscribedTo, subscribedToUser).

\*\*Create gql requests:
2.8. Create user.

<code>
mutation mutationType($data:UserInputDTO!) {
            createUser(data:$data) {
                id
                lastName
                firstName
                email
                subscribedToUserIds
            }
        }
</code>

#user data
<code>
{
"data" : {
"lastName": "test",
"firstName": "tester",
"email":"testee@rsschool.com"
}
}
</code>

2.9. Create profile.
<code>
mutation mutationType($data:ProfileInputDTO!) {
        createProfile(data:$data) {
id
avatar
birthday
city
userId
}
}
</code>

#Profile data
<code>
{
"data": {
"avatar": "ava",
"sex": "unknown",
"birthday": 1,
"country": "SUD",
"street": "test",
"city": "test",
"userId": "046df2e6-5804-47d9-adcc-71401555d3f7",
"memberTypeId": "basic"
}
}
</code>

2.10. Create post.

<code>
mutation mutationType($data:PostInputDTO!) {
        createPost(data:$data) {
            id
            title
            content
            userId
        }
    }
</code>

#data

<code>
{
    "data": {
        "title": "test",
        "content": "PPPossst",
        "userId": "046df2e6-5804-47d9-adcc-71401555d3f7"
    }
}
</code>
2.11. InputObjectType for DTOs.

\*\* Update gql requests:
2.12. Update user.
<code>
mutation mutationType($data:ChangeUserInputDTO!) {
        updateUser( data:$data) {
id
lastName
firstName
email
}
}
</code>

<code>
{
    "data": {
        "lastName": "Fedora",
        "firstName": "Yan",
        "email": "test",
        "id": "f5321416-aa33-48b9-9c13-02d177833332"
    }
}
</code>

2.13. Update profile.

<code>
mutation mutationType($data:ChangeProfileInputDTO!) {
        updateProfile(data:$data) {
                id
                avatar
                birthday
                city
                userId
        }
    }
</code>

#data
<code>
{
"data":{
"id": "fe02b100-0f13-4894-8206-0f8aabd3283f",
"avatar": "test",
"city": "NY"
}
}
</code>

2.14. Update post.

<code>
mutation mutationType($data:ChangePostInputDTO!) {
            updatePost(data:$data) {
                id
                title
                content
                userId
            }
        }
</code>

#data
<code>
{
"data":{
"id":"99a86143-8c58-4c17-b1a4-8af8a2990b8f",
"title": "test2",
"content": "the POOOOOST",
"userId":"046df2e6-5804-47d9-adcc-71401555d3f"
}
}code>

2.15. Update memberType.

<code>
mutation mutationType($data:ChangeMemberTypeInputDTO!) {
        updateMemberType(data:$data) {
                id
                discount
                monthPostsLimit
            }
        }
</code>

#data
<code>
{
"data": {
"id": "business",
"discount": 3,
"monthPostsLimit": 5
}
}
</code>

2.16. Subscribe to; unsubscribe from.

Subscribe
<code>
mutation mutationType($data:SubscribeInputDTO!) {
            subscribeTo(data:$data){
id
lastName
firstName
email
subscribedToUserIds
}
}
</code>

<code>
{
    "data": {
        "id": "00000000-0000-0000-0000-000000000000",
        "userId": "046df2e6-5804-47d9-adcc-71401555d3f7"
    }
}
</code>

I subscribe himself to himself.

<code>

AND

Then subscribe with
#data
<code>
{
"data": {
"id": "046df2e6-5804-47d9-adcc-71401555d3f7",
"userId": "046df2e6-5804-47d9-adcc-71401555d3f7"
}
}
</code>

Unsubscribe
<code>
mutation mutationType($data:SubscribeInputDTO!) {
            unsubscribeFrom(data:$data){
id
lastName
firstName
email
subscribedToUserIds
}
}
</code>

#data
<code>
{
"data": {
"id": "046df2e6-5804-47d9-adcc-71401555d3f7",
"userId": "046df2e6-5804-47d9-adcc-71401555d3f7"
}
}
</code>

It works!

2.17. InputObjectType for DTOs.
