from rest_framework.decorators import api_view
from rest_framework.response import Response
from .ml_service import predict_aapl


@api_view(['GET'])
def predict_view(request):
    result = predict_aapl()
    return Response(result)