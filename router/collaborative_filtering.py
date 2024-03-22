import pymysql
import pandas as pd
from surprise import Dataset, Reader
from surprise.model_selection import train_test_split
from surprise import accuracy
from surprise import SVD
import time
import json

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

# train/ test 데이터셋 분리
split_bound = rating_df['createdAt'].quantile(q=0.8)
train_df = rating_df[rating_df['createdAt'] < split_bound]
test_df = rating_df[rating_df['createdAt'] >= split_bound]

# matrix factorization 
reader = Reader(rating_scale=(1,5))
data = Dataset.load_from_df(train_df[['userID', 'movieID', 'rating']], reader)
trainset, validset = train_test_split(data, test_size=.20)
#미리 준비해둔 validset으로 모델 rmse측정
algo = SVD(n_factors = 10)
algo.fit(trainset)
prediction = algo.test(validset)

#print(accuracy.rmse(prediction))

#파라미터 튜닝
# param_list = [10,50,100,150,200]
# rmse_list_by_factors = []
# time_list_by_factors = []
# for n in param_list:
#     train_start = time.time()
#     algo = SVD(n_factors=n)
#     algo.fit(trainset)
#     train_end = time.time()
#     prediction = algo.test(validset)
#     rmse_result = accuracy.rmse(prediction)
#     print(rmse_result)

#모델학습
reader = Reader(rating_scale=(1,5))
data = Dataset.load_from_df(train_df[['userID', 'movieID', 'rating']], reader)
train_data = data.build_full_trainset()
algo = SVD(n_factors=10)
algo.fit(train_data)

#학습데이터로 예측
target_data = train_data.build_anti_testset()

prediction = algo.test(target_data)

prediction_rating_dict = {}

for i in range(0, len(prediction)-1):
    if prediction[i].uid not in prediction_rating_dict:
        prediction_rating_dict[prediction[i].uid] = []
        prediction_rating_dict[prediction[i].uid].append({'movieID' : prediction[i].iid, 'real' : prediction[i].r_ui, 'predictive' : prediction[i].est})
    else : 
        prediction_rating_dict[prediction[i].uid].append({'movieID' : prediction[i].iid, 'real' : prediction[i].r_ui, 'predictive' : prediction[i].est})

# 결과 데이터를 파일에 쓰기
# with open('prediction_result.json', 'w') as f:
#     json.dump(prediction_rating_dict, f)