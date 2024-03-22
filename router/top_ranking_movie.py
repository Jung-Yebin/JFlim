import pymysql
import pandas as pd

conn = pymysql.connect(host='localhost', port=3306, user='root', passwd='acb0519731', db='jfilm', charset='utf8')

cursor = conn.cursor()

sql = 'SELECT * FROM `rating`'
cursor.execute(sql)

result = cursor.fetchall()
dataframe_list = []
for res in result:
    dataframe_list.append(list(res))
conn.close()

rating_df  = pd.DataFrame(dataframe_list, columns=['Index', 'userID', 'movieID', 'rating', 'posterImg', 'date', 'title','genre', 'createdAt', 'updatedAt'])
## 1. 유저들의 평가가 높은 순서대로 k개의 영화 추천
movie_ratings_sum = rating_df.groupby('movieID')['rating'].sum()
movie_ratings_count = rating_df.groupby('movieID')['rating'].count()

movie_average_ratings = movie_ratings_sum / movie_ratings_count.fillna(0)

rating_df['AverageScore'] = rating_df['movieID'].map(movie_average_ratings)

# rating_df = rating_df.sort_values(['AverageScore'], ascending=False)

k = 10
top_ranking_movie = rating_df.groupby('movieID')['AverageScore'].mean().sort_values(ascending=False).head(k).index.tolist()
# print(top_ranking_movie)
print("top_ranking_movie", top_ranking_movie)

## 2. 유저들의 시청빈도가 높은 순서대로 5개의 영화추천
top_count_movie = rating_df.groupby('movieID')['rating'].count().sort_values(ascending=False).head(k).index.tolist()
print("top_count_movie", top_count_movie)
#나중에 추가할것 : count가 1인 영화는 날릴것

